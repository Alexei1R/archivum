import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HotkeyPresets, hotkeyManager } from "@/shared/services"

interface UseHotkeyConfig {
    preset?: string
    combo?: string
    action: () => void
    description?: string
    priority?: number
    sequence?: boolean
    scope?: string
    enabled?: boolean
}

interface UseHotkeyStats {
    totalRegistered: number
    totalTriggered: number
    scopeStats: Record<string, number>
}

interface HotkeyInfo {
    combo: string
    description?: string
    priority: number
    scope?: string
    enabled?: boolean
}

const useHotkeys = (configs: UseHotkeyConfig[]) => {
    const managerRef = useRef(hotkeyManager)
    const [hotkeys, setHotkeys] = useState<HotkeyInfo[]>([])
    const [stats, setStats] = useState<UseHotkeyStats>({
        totalRegistered: 0,
        totalTriggered: 0,
        scopeStats: {}
    })

    const memoizedConfigs = useMemo(() => configs, [JSON.stringify(configs)])

    const updateState = useCallback(() => {
        const list = managerRef.current.getHotkeys().map(h => ({
            combo: h.combo,
            description: h.description,
            priority: h.priority || 0,
            scope: h.scope,
            enabled: h.enabled !== false
        }))
        setHotkeys(list.sort((a, b) => b.priority - a.priority))

        const serviceStats = managerRef.current.getStats()
        setStats({
            totalRegistered: serviceStats.totalRegistered,
            totalTriggered: serviceStats.totalTriggered,
            scopeStats: serviceStats.scopeStats
        })
    }, [])

    const getNestedProperty = useCallback((obj: any, path: string) => {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }, [])

    const resolvePreset = useCallback((preset: string) => {
        const presetFn = getNestedProperty(HotkeyPresets, preset)
        if (typeof presetFn !== 'function') {
            throw new Error(`Preset "${preset}" not found`)
        }
        return presetFn
    }, [getNestedProperty])

    const createHandler = useCallback((config: UseHotkeyConfig) => {
        return () => {
            if (config.enabled !== false) {
                config.action()
            }
        }
    }, [])

    const registerHotkey = useCallback((config: UseHotkeyConfig) => {
        let hotkeyConfig: any

        if (config.preset) {
            const presetFn = resolvePreset(config.preset)
            const handler = createHandler(config)
            const presetConfig = presetFn(handler)

            hotkeyConfig = {
                ...presetConfig,
                description: config.description || presetConfig.description,
                priority: config.priority ?? presetConfig.priority ?? 0,
                scope: config.scope || presetConfig.scope,
                enabled: config.enabled ?? true
            }
        } else if (config.combo) {
            hotkeyConfig = {
                combo: config.combo,
                handler: createHandler(config),
                priority: config.priority ?? 0,
                description: config.description,
                sequence: config.sequence,
                scope: config.scope,
                enabled: config.enabled ?? true
            }
        } else {
            throw new Error("Either preset or combo must be specified")
        }

        return managerRef.current.register(hotkeyConfig)
    }, [resolvePreset, createHandler])

    const registerAll = useCallback(() => {
        const unregisterFns = memoizedConfigs.map(config => {
            try {
                return registerHotkey(config)
            } catch (error) {
                console.error(`Failed to register hotkey:`, error)
                return () => { }
            }
        })

        updateState()
        return () => unregisterFns.forEach(fn => fn())
    }, [memoizedConfigs, registerHotkey, updateState])

    const clear = useCallback(() => {
        managerRef.current.clear()
        updateState()
    }, [updateState])

    const setScope = useCallback((scope: string) => {
        managerRef.current.setScope(scope)
    }, [])

    useEffect(() => {
        const cleanup = registerAll()
        return cleanup
    }, [registerAll])

    return {
        hotkeys,
        stats,
        clear,
        setScope,
        updateState
    }
}

export { useHotkeys }
export type { UseHotkeyConfig, UseHotkeyStats, HotkeyInfo }
