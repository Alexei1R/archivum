import type { JSX } from "react"

type Shortcut = string
type Group = "navigation" | "actions" | "settings" | "other"
type CommandScope = "global" | "page" | "editor"

interface CommandConfirm {
    message: string
    level?: "info" | "warn" | "danger"
}

export interface CommandContext {
    scope: string
    navigate?: (to: string) => void
}

interface Command {
    id: string
    name: string
    description?: string
    group: Group
    keywords: string[]
    needsConfirmation?: CommandConfirm | null
    icon?: JSX.Element | null
    color?: string | null
    shortcut?: Shortcut | null
    run?: (() => void) | null
    scope?: CommandScope // optional scope for commands
}

export type { Command, CommandScope, CommandConfirm, Shortcut, Group }
