type HotkeyHandler = (event: KeyboardEvent, context: HotkeyContext) => void | boolean
type PreventDefaultMode = "always" | "never" | "conditional"
type EventType = "keydown" | "keyup" | "keypress"

interface HotkeyContext {
    combo: string
    scope: string
    priority: number
    metadata?: Record<string, any>
}

interface HotkeyConfig {
    combo: string
    handler: HotkeyHandler
    priority?: number
    scope?: string
    eventType?: EventType
    preventDefault?: PreventDefaultMode
    stopPropagation?: boolean
    description?: string
    enabled?: boolean
    metadata?: Record<string, any>
    element?: HTMLElement
    condition?: (event: KeyboardEvent) => boolean
    sequence?: boolean
    sequenceTimeout?: number
}

interface HotkeyGroup {
    name: string
    hotkeys: HotkeyConfig[]
    enabled: boolean
}

interface ModifierKeys {
    ctrl: boolean
    shift: boolean
    alt: boolean
    meta: boolean
    key: string
}

interface HotkeyStats {
    totalRegistered: number
    totalTriggered: number
    scopeStats: Record<string, number>
    lastTriggered?: Date
}

interface SequenceState {
    keys: string[]
    timestamp: number
    timeoutId?: ReturnType<typeof setTimeout>
}

class HotkeyError extends Error {
    code: string

    constructor(message: string, code: string) {
        super(message)
        this.name = "HotkeyError"
        this.code = code
    }
}

class HotkeyManager {
    private hotkeys = new Map<string, HotkeyConfig>()
    private groups = new Map<string, HotkeyGroup>()
    private boundElements = new WeakMap<HTMLElement, Set<EventType>>()
    private globalListeners = new Set<EventType>()
    private currentScope = "global"
    private stats: HotkeyStats = {
        totalRegistered: 0,
        totalTriggered: 0,
        scopeStats: {}
    }
    private isEnabled = true
    private middleware: Array<(event: KeyboardEvent, context: HotkeyContext) => boolean> = []
    private sequenceState: SequenceState = { keys: [], timestamp: 0 }
    private readonly DEFAULT_SEQUENCE_TIMEOUT = 800

    register(config: HotkeyConfig): () => void {
        const id = this.generateId(config)
        const normalizedConfig = this.normalizeConfig(config)

        this.validateConfig(normalizedConfig)

        if (!this.hotkeys.has(id)) {
            this.stats.totalRegistered++
        }

        this.hotkeys.set(id, normalizedConfig)
        this.bindEventType(normalizedConfig.eventType!, normalizedConfig.element)

        return () => this.unregister(id)
    }

    registerPreset(preset: HotkeyConfig): () => void {
        return this.register(preset)
    }

    registerMultiple(configs: HotkeyConfig[]): () => void {
        const unregisterFns = configs.map(config => this.register(config))
        return () => unregisterFns.forEach(fn => fn())
    }

    on(combo: string): HotkeyBuilder {
        return new HotkeyBuilder(this, combo)
    }

    createGroup(name: string, hotkeys: HotkeyConfig[] = []): HotkeyGroup {
        const group: HotkeyGroup = { name, hotkeys, enabled: true }
        this.groups.set(name, group)
        hotkeys.forEach(config => this.register({ ...config, metadata: { ...config.metadata, group: name } }))
        return group
    }

    toggleGroup(name: string, enabled?: boolean): void {
        const group = this.groups.get(name)
        if (!group) throw new HotkeyError(`Group '${name}' not found`, "GROUP_NOT_FOUND")

        group.enabled = enabled ?? !group.enabled
        this.hotkeys.forEach(config => {
            if (config.metadata?.group === name) {
                config.enabled = group.enabled
            }
        })
    }

    setScope(scope: string): void {
        this.currentScope = scope
    }

    withScope<T>(scope: string, fn: () => T): T {
        const previousScope = this.currentScope
        this.setScope(scope)
        try {
            return fn()
        } finally {
            this.setScope(previousScope)
        }
    }

    use(middleware: (event: KeyboardEvent, context: HotkeyContext) => boolean): () => void {
        this.middleware.push(middleware)
        return () => {
            const index = this.middleware.indexOf(middleware)
            if (index > -1) this.middleware.splice(index, 1)
        }
    }

    private createHandler = (eventType: EventType) =>
        (event: KeyboardEvent) => {
            if (!this.isEnabled) return

            const currentTime = Date.now()
            const key = this.normalizeKey(event.key)

            if (this.handleSequence(event, key, currentTime)) return

            const matches = this.findMatches(event, eventType)
            if (!matches.length) return

            const topMatch = matches[0]
            this.executeHandler(event, topMatch)
        }

    private handleSequence(event: KeyboardEvent, key: string, currentTime: number): boolean {
        if (currentTime - this.sequenceState.timestamp > this.DEFAULT_SEQUENCE_TIMEOUT) {
            this.resetSequence()
        }

        this.sequenceState.keys.push(key)
        this.sequenceState.timestamp = currentTime

        if (this.sequenceState.timeoutId) {
            clearTimeout(this.sequenceState.timeoutId)
        }

        const sequenceString = this.sequenceState.keys.join(' ')
        const sequenceMatches = Array.from(this.hotkeys.values())
            .filter(config => config.sequence && config.enabled !== false)
            .filter(config => this.matchesScope(config))
            .filter(config => !config.condition || config.condition(event))
            .filter(config => this.matchSequence(sequenceString, config.combo))

        if (sequenceMatches.length > 0) {
            event.preventDefault()
            event.stopPropagation()

            const topMatch = sequenceMatches.sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)))[0]
            this.executeHandler(event, topMatch)
            this.resetSequence()
            return true
        }

        this.sequenceState.timeoutId = setTimeout(() => {
            this.resetSequence()
        }, this.DEFAULT_SEQUENCE_TIMEOUT)

        return false
    }

    private matchSequence(sequence: string, combo: string): boolean {
        return sequence === combo || sequence.endsWith(' ' + combo)
    }

    private resetSequence(): void {
        this.sequenceState.keys = []
        this.sequenceState.timestamp = 0
        if (this.sequenceState.timeoutId) {
            clearTimeout(this.sequenceState.timeoutId)
            this.sequenceState.timeoutId = undefined
        }
    }

    private executeHandler(event: KeyboardEvent, config: HotkeyConfig): void {
        const context: HotkeyContext = {
            combo: config.combo,
            scope: config.scope ?? "global",
            priority: config.priority ?? 0,
            metadata: config.metadata
        }

        for (const mw of this.middleware) {
            if (!mw(event, context)) return
        }

        this.handlePreventDefault(event, config)

        if (config.stopPropagation) {
            event.stopPropagation()
        }

        const result = config.handler(event, context)

        this.stats.totalTriggered++
        if (config.scope) {
            this.stats.scopeStats[config.scope] = (this.stats.scopeStats[config.scope] || 0) + 1
        }
        this.stats.lastTriggered = new Date()

        if (result === false) return
    }

    private findMatches(event: KeyboardEvent, eventType: EventType): HotkeyConfig[] {
        return Array.from(this.hotkeys.values())
            .filter(config => !config.sequence && config.enabled !== false)
            .filter(config => config.eventType === eventType)
            .filter(config => this.matchesScope(config))
            .filter(config => !config.condition || config.condition(event))
            .filter(config => this.matchCombo(event, config.combo))
            .sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)))
    }

    private matchesScope(config: HotkeyConfig): boolean {
        return config.scope === this.currentScope || config.scope === "global"
    }

    private parseCombo(combo: string): ModifierKeys {
        const parts = combo.toLowerCase().trim().split(/\s*\+\s*/)
        const modifiers = new Set(parts)

        return {
            ctrl: modifiers.has("ctrl") || modifiers.has("control"),
            shift: modifiers.has("shift"),
            alt: modifiers.has("alt"),
            meta: modifiers.has("meta") || modifiers.has("cmd") || modifiers.has("command"),
            key: parts.find(part => !["ctrl", "control", "shift", "alt", "meta", "cmd", "command"].includes(part)) || ""
        }
    }

    private matchCombo(event: KeyboardEvent, combo: string): boolean {
        const parsed = this.parseCombo(combo)
        const eventKey = this.normalizeKey(event.key)
        const comboKey = this.normalizeKey(parsed.key)

        return (
            event.ctrlKey === parsed.ctrl &&
            event.shiftKey === parsed.shift &&
            event.altKey === parsed.alt &&
            event.metaKey === parsed.meta &&
            eventKey === comboKey
        )
    }

    private normalizeKey(key: string): string {
        const keyMap: Record<string, string> = {
            " ": "space",
            "escape": "esc",
            "delete": "del",
            "arrowup": "up",
            "arrowdown": "down",
            "arrowleft": "left",
            "arrowright": "right"
        }
        return keyMap[key.toLowerCase()] || key.toLowerCase()
    }

    private generateId(config: HotkeyConfig): string {
        const sequenceFlag = config.sequence ? '-seq' : ''
        return `${config.combo}-${config.scope || "global"}-${config.eventType || "keydown"}${sequenceFlag}`
    }

    private normalizeConfig(config: HotkeyConfig): HotkeyConfig {
        return {
            ...config,
            priority: config.priority ?? 0,
            scope: config.scope ?? "global",
            eventType: config.eventType ?? "keydown",
            preventDefault: config.preventDefault ?? "always",
            stopPropagation: config.stopPropagation ?? true,
            enabled: config.enabled ?? true,
            sequence: config.sequence ?? false,
            sequenceTimeout: config.sequenceTimeout ?? this.DEFAULT_SEQUENCE_TIMEOUT
        }
    }

    private validateConfig(config: HotkeyConfig): void {
        if (!config.combo?.trim()) {
            throw new HotkeyError("Combo is required", "INVALID_COMBO")
        }
        if (!config.handler || typeof config.handler !== "function") {
            throw new HotkeyError("Handler must be a function", "INVALID_HANDLER")
        }
    }

    private handlePreventDefault(event: KeyboardEvent, config: HotkeyConfig): void {
        switch (config.preventDefault) {
            case "always":
                event.preventDefault()
                break
            case "conditional":
                break
            case "never":
                break
        }
    }

    private bindEventType(eventType: EventType, element?: HTMLElement): void {
        if (element) {
            const boundEvents = this.boundElements.get(element) || new Set()
            if (boundEvents.has(eventType)) return

            element.addEventListener(eventType, this.createHandler(eventType))
            boundEvents.add(eventType)
            this.boundElements.set(element, boundEvents)
        } else {
            if (this.globalListeners.has(eventType)) return

            window.addEventListener(eventType, this.createHandler(eventType))
            this.globalListeners.add(eventType)
        }
    }

    unregister(id: string): boolean {
        const existed = this.hotkeys.has(id)
        if (existed) {
            this.stats.totalRegistered--
        }
        return this.hotkeys.delete(id)
    }

    clear(): void {
        this.stats.totalRegistered = 0
        this.hotkeys.clear()
        this.groups.clear()
        this.resetSequence()
    }

    enable(): void {
        this.isEnabled = true
    }

    disable(): void {
        this.isEnabled = false
    }

    getStats(): Readonly<HotkeyStats> {
        return { ...this.stats }
    }

    getHotkeys(scope?: string): HotkeyConfig[] {
        const hotkeys = Array.from(this.hotkeys.values())
        return scope ? hotkeys.filter(h => h.scope === scope) : hotkeys
    }

    isComboRegistered(combo: string, scope?: string): boolean {
        return this.getHotkeys(scope).some(h => h.combo === combo)
    }

    destroy(): void {
        this.globalListeners.forEach(eventType => {
            window.removeEventListener(eventType, this.createHandler(eventType))
        })

        this.resetSequence()
        this.hotkeys.clear()
        this.groups.clear()
        this.globalListeners.clear()
        this.middleware = []
        this.stats = {
            totalRegistered: 0,
            totalTriggered: 0,
            scopeStats: {}
        }
    }
}

class HotkeyBuilder {
    private config: Partial<HotkeyConfig> = {}
    private manager: HotkeyManager

    constructor(manager: HotkeyManager, combo: string) {
        this.manager = manager
        this.config.combo = combo
    }

    do(handler: HotkeyHandler): HotkeyBuilder {
        this.config.handler = handler
        return this
    }

    priority(priority: number): HotkeyBuilder {
        this.config.priority = priority
        return this
    }

    scope(scope: string): HotkeyBuilder {
        this.config.scope = scope
        return this
    }

    onKeyUp(): HotkeyBuilder {
        this.config.eventType = "keyup"
        return this
    }

    onKeyDown(): HotkeyBuilder {
        this.config.eventType = "keydown"
        return this
    }

    preventDefault(mode: PreventDefaultMode = "always"): HotkeyBuilder {
        this.config.preventDefault = mode
        return this
    }

    stopPropagation(stop = true): HotkeyBuilder {
        this.config.stopPropagation = stop
        return this
    }

    describe(description: string): HotkeyBuilder {
        this.config.description = description
        return this
    }

    when(condition: (event: KeyboardEvent) => boolean): HotkeyBuilder {
        this.config.condition = condition
        return this
    }

    withMetadata(metadata: Record<string, any>): HotkeyBuilder {
        this.config.metadata = metadata
        return this
    }

    asSequence(timeout?: number): HotkeyBuilder {
        this.config.sequence = true
        if (timeout) this.config.sequenceTimeout = timeout
        return this
    }

    register(): () => void {
        if (!this.config.handler) {
            throw new HotkeyError("Handler is required", "MISSING_HANDLER")
        }
        return this.manager.register(this.config as HotkeyConfig)
    }
}

export const HotkeyPresets = {
    save: (handler: HotkeyHandler) => ({ combo: "ctrl+s", handler, description: "Save" }),
    copy: (handler: HotkeyHandler) => ({ combo: "ctrl+c", handler, description: "Copy" }),
    paste: (handler: HotkeyHandler) => ({ combo: "ctrl+v", handler, description: "Paste" }),
    undo: (handler: HotkeyHandler) => ({ combo: "ctrl+z", handler, description: "Undo" }),
    redo: (handler: HotkeyHandler) => ({ combo: "ctrl+y", handler, description: "Redo" }),
    find: (handler: HotkeyHandler) => ({ combo: "ctrl+f", handler, description: "Find" }),
    escape: (handler: HotkeyHandler) => ({ combo: "escape", handler, description: "Escape" }),
    enter: (handler: HotkeyHandler) => ({ combo: "enter", handler, description: "Enter" }),
    search: (handler: HotkeyHandler) => ({ combo: "ctrl+k", handler, description: "Search" }),
    focus: (handler: HotkeyHandler) => ({ combo: "tab", handler, description: "Focus Next" }),
    blur: (handler: HotkeyHandler) => ({ combo: "shift+tab", handler, description: "Focus Previous" }),
    fullscreen: (handler: HotkeyHandler) => ({ combo: "ctrl+shift+w", handler, description: "Toggle Fullscreen" }),
    toggleSidebar: (handler: HotkeyHandler) => ({ combo: "ctrl+b", handler, description: "Toggle Sidebar" }),
    toggleSettings: (handler: HotkeyHandler) => ({ combo: "ctrl+shift+s", handler, description: "Toggle Settings" }),
    toggleTheme: (handler: HotkeyHandler) => ({ combo: "ctrl+shift+t", handler, description: "Toggle Theme" }),
    toggleNotifications: (handler: HotkeyHandler) => ({ combo: "ctrl+shift+n", handler, description: "Toggle Notifications" }),

    commandPalette: (handler: HotkeyHandler) => ({ combo: "space space", handler, description: "Command Palette", sequence: true }),

    vim: {
        up: (handler: HotkeyHandler) => ({ combo: "k", handler, description: "Move up" }),
        down: (handler: HotkeyHandler) => ({ combo: "j", handler, description: "Move down" }),
        left: (handler: HotkeyHandler) => ({ combo: "h", handler, description: "Move left" }),
        right: (handler: HotkeyHandler) => ({ combo: "l", handler, description: "Move right" }),
        wordForward: (handler: HotkeyHandler) => ({ combo: "w", handler, description: "Word forward" }),
        wordBackward: (handler: HotkeyHandler) => ({ combo: "b", handler, description: "Word backward" }),
        wordEnd: (handler: HotkeyHandler) => ({ combo: "e", handler, description: "End of word" }),
        lineStart: (handler: HotkeyHandler) => ({ combo: "0", handler, description: "Start of line" }),
        lineEnd: (handler: HotkeyHandler) => ({ combo: "$", handler, description: "End of line" }),
        firstNonBlank: (handler: HotkeyHandler) => ({ combo: "^", handler, description: "First non-blank" }),
        documentStart: (handler: HotkeyHandler) => ({ combo: "g g", handler, description: "Document start", sequence: true }),
        documentEnd: (handler: HotkeyHandler) => ({ combo: "shift+g", handler, description: "Document end" }),
        pageUp: (handler: HotkeyHandler) => ({ combo: "ctrl+u", handler, description: "Page up" }),
        pageDown: (handler: HotkeyHandler) => ({ combo: "ctrl+d", handler, description: "Page down" }),
        halfPageUp: (handler: HotkeyHandler) => ({ combo: "ctrl+b", handler, description: "Half page up" }),
        halfPageDown: (handler: HotkeyHandler) => ({ combo: "ctrl+f", handler, description: "Half page down" }),
        insert: (handler: HotkeyHandler) => ({ combo: "i", handler, description: "Insert mode" }),
        insertLineStart: (handler: HotkeyHandler) => ({ combo: "shift+i", handler, description: "Insert at line start" }),
        append: (handler: HotkeyHandler) => ({ combo: "a", handler, description: "Append" }),
        appendLineEnd: (handler: HotkeyHandler) => ({ combo: "shift+a", handler, description: "Append at line end" }),
        openLineBelow: (handler: HotkeyHandler) => ({ combo: "o", handler, description: "Open line below" }),
        openLineAbove: (handler: HotkeyHandler) => ({ combo: "shift+o", handler, description: "Open line above" }),
        deleteChar: (handler: HotkeyHandler) => ({ combo: "x", handler, description: "Delete character" }),
        deleteCharBefore: (handler: HotkeyHandler) => ({ combo: "shift+x", handler, description: "Delete char before" }),
        deleteLine: (handler: HotkeyHandler) => ({ combo: "d d", handler, description: "Delete line", sequence: true }),
        deleteToEnd: (handler: HotkeyHandler) => ({ combo: "shift+d", handler, description: "Delete to end" }),
        deleteWord: (handler: HotkeyHandler) => ({ combo: "d w", handler, description: "Delete word", sequence: true }),
        yank: (handler: HotkeyHandler) => ({ combo: "y", handler, description: "Yank" }),
        yankLine: (handler: HotkeyHandler) => ({ combo: "y y", handler, description: "Yank line", sequence: true }),
        yankToEnd: (handler: HotkeyHandler) => ({ combo: "shift+y", handler, description: "Yank to end" }),
        put: (handler: HotkeyHandler) => ({ combo: "p", handler, description: "Put after" }),
        putBefore: (handler: HotkeyHandler) => ({ combo: "shift+p", handler, description: "Put before" }),
        change: (handler: HotkeyHandler) => ({ combo: "c", handler, description: "Change" }),
        changeLine: (handler: HotkeyHandler) => ({ combo: "c c", handler, description: "Change line", sequence: true }),
        changeToEnd: (handler: HotkeyHandler) => ({ combo: "shift+c", handler, description: "Change to end" }),
        replace: (handler: HotkeyHandler) => ({ combo: "r", handler, description: "Replace char" }),
        replaceMode: (handler: HotkeyHandler) => ({ combo: "shift+r", handler, description: "Replace mode" }),
        undo: (handler: HotkeyHandler) => ({ combo: "u", handler, description: "Undo" }),
        redo: (handler: HotkeyHandler) => ({ combo: "ctrl+r", handler, description: "Redo" }),
        search: (handler: HotkeyHandler) => ({ combo: "/", handler, description: "Search" }),
        searchBackward: (handler: HotkeyHandler) => ({ combo: "?", handler, description: "Search backward" }),
        searchNext: (handler: HotkeyHandler) => ({ combo: "n", handler, description: "Search next" }),
        searchPrevious: (handler: HotkeyHandler) => ({ combo: "shift+n", handler, description: "Search previous" }),
        findChar: (handler: HotkeyHandler) => ({ combo: "f", handler, description: "Find character" }),
        findCharBackward: (handler: HotkeyHandler) => ({ combo: "shift+f", handler, description: "Find char backward" }),
        tillChar: (handler: HotkeyHandler) => ({ combo: "t", handler, description: "Till character" }),
        tillCharBackward: (handler: HotkeyHandler) => ({ combo: "shift+t", handler, description: "Till char backward" }),
        repeatFind: (handler: HotkeyHandler) => ({ combo: ";", handler, description: "Repeat find" }),
        repeatFindReverse: (handler: HotkeyHandler) => ({ combo: ",", handler, description: "Repeat find reverse" }),
        setMark: (handler: HotkeyHandler) => ({ combo: "m", handler, description: "Set mark" }),
        jumpToMark: (handler: HotkeyHandler) => ({ combo: "'", handler, description: "Jump to mark" }),
        jumpToMarkColumn: (handler: HotkeyHandler) => ({ combo: "`", handler, description: "Jump to mark column" }),
        jumpBack: (handler: HotkeyHandler) => ({ combo: "ctrl+o", handler, description: "Jump back" }),
        jumpForward: (handler: HotkeyHandler) => ({ combo: "ctrl+i", handler, description: "Jump forward" }),
        visual: (handler: HotkeyHandler) => ({ combo: "v", handler, description: "Visual mode" }),
        visualLine: (handler: HotkeyHandler) => ({ combo: "shift+v", handler, description: "Visual line" }),
        visualBlock: (handler: HotkeyHandler) => ({ combo: "ctrl+v", handler, description: "Visual block" }),
        innerWord: (handler: HotkeyHandler) => ({ combo: "i w", handler, description: "Inner word", sequence: true }),
        aroundWord: (handler: HotkeyHandler) => ({ combo: "a w", handler, description: "Around word", sequence: true }),
        innerParagraph: (handler: HotkeyHandler) => ({ combo: "i p", handler, description: "Inner paragraph", sequence: true }),
        aroundParagraph: (handler: HotkeyHandler) => ({ combo: "a p", handler, description: "Around paragraph", sequence: true }),
        innerParens: (handler: HotkeyHandler) => ({ combo: "i (", handler, description: "Inner parentheses", sequence: true }),
        aroundParens: (handler: HotkeyHandler) => ({ combo: "a (", handler, description: "Around parentheses", sequence: true }),
        innerBrackets: (handler: HotkeyHandler) => ({ combo: "i [", handler, description: "Inner brackets", sequence: true }),
        aroundBrackets: (handler: HotkeyHandler) => ({ combo: "a [", handler, description: "Around brackets", sequence: true }),
        innerBraces: (handler: HotkeyHandler) => ({ combo: "i {", handler, description: "Inner braces", sequence: true }),
        aroundBraces: (handler: HotkeyHandler) => ({ combo: "a {", handler, description: "Around braces", sequence: true }),
        innerQuotes: (handler: HotkeyHandler) => ({ combo: "i \"", handler, description: "Inner quotes", sequence: true }),
        aroundQuotes: (handler: HotkeyHandler) => ({ combo: "a \"", handler, description: "Around quotes", sequence: true }),
        command: (handler: HotkeyHandler) => ({ combo: ":", handler, description: "Command mode" }),
        quit: (handler: HotkeyHandler) => ({ combo: ": q", handler, description: "Quit", sequence: true }),
        write: (handler: HotkeyHandler) => ({ combo: ": w", handler, description: "Write", sequence: true }),
        writeQuit: (handler: HotkeyHandler) => ({ combo: ": w q", handler, description: "Write and quit", sequence: true }),
        forceQuit: (handler: HotkeyHandler) => ({ combo: ": q !", handler, description: "Force quit", sequence: true }),
        escape: (handler: HotkeyHandler) => ({ combo: "escape", handler, description: "Escape to normal" }),
        escapeJK: (handler: HotkeyHandler) => ({ combo: "j k", handler, description: "Escape (jk)", sequence: true }),
        escapeKJ: (handler: HotkeyHandler) => ({ combo: "k j", handler, description: "Escape (kj)", sequence: true }),
        repeat: (handler: HotkeyHandler) => ({ combo: ".", handler, description: "Repeat last command" }),
        recordMacro: (handler: HotkeyHandler) => ({ combo: "q", handler, description: "Record macro" }),
        playMacro: (handler: HotkeyHandler) => ({ combo: "@", handler, description: "Play macro" }),
        splitHorizontal: (handler: HotkeyHandler) => ({ combo: "ctrl+w s", handler, description: "Split horizontal", sequence: true }),
        splitVertical: (handler: HotkeyHandler) => ({ combo: "ctrl+w v", handler, description: "Split vertical", sequence: true }),
        windowNext: (handler: HotkeyHandler) => ({ combo: "ctrl+w w", handler, description: "Next window", sequence: true }),
        windowClose: (handler: HotkeyHandler) => ({ combo: "ctrl+w c", handler, description: "Close window", sequence: true }),
        foldToggle: (handler: HotkeyHandler) => ({ combo: "z a", handler, description: "Toggle fold", sequence: true }),
        foldOpen: (handler: HotkeyHandler) => ({ combo: "z o", handler, description: "Open fold", sequence: true }),
        foldClose: (handler: HotkeyHandler) => ({ combo: "z c", handler, description: "Close fold", sequence: true }),
        foldOpenAll: (handler: HotkeyHandler) => ({ combo: "z shift+r", handler, description: "Open all folds", sequence: true }),
        foldCloseAll: (handler: HotkeyHandler) => ({ combo: "z shift+m", handler, description: "Close all folds", sequence: true }),
    }
} as const

export const hotkeyManager = new HotkeyManager()
export { HotkeyManager, HotkeyBuilder, HotkeyError }
export type { HotkeyConfig, HotkeyHandler, HotkeyContext, HotkeyGroup, HotkeyStats }
