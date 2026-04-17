import { create } from "zustand"
import type { Command, CommandContext, CommandScope } from "../types"

export interface RegistryState {
    scope: CommandScope
    setScope: (scope: CommandScope) => void
    commands: Record<string, Command>
    register: (command: Command) => () => void
    unregister: (id: string) => void
    run: (id: string) => Promise<unknown>
    getAllCommands: (scope?: CommandScope) => Command[]
    getCommand: (id: string) => Command | null
    context: CommandContext
    setContext: (partial: Partial<CommandContext>) => void
}

export const useCommandRegistry = create<RegistryState>((set, get) => ({
    scope: "global",
    commands: {},
    context: { scope: "global" },

    setScope: (scope: CommandScope) => set({ scope }),

    register: (command: Command) => {
        const id = command.id
        set((state) => ({
            commands: { ...state.commands, [id]: command },
        }))
        return () => get().unregister(id)
    },

    unregister: (id: string) =>
        set((state) => {
            const { [id]: removed, ...rest } = state.commands
            return { commands: rest }
        }),

    getAllCommands: (scope?: CommandScope) => {
        const all = Object.values(get().commands)
        if (!scope) return all
        return all.filter((c) => (c.scope ?? "global") === scope)
    },

    getCommand: (id: string) => get().commands[id] ?? null,

    run: async (id: string) => {
        const cmd = get().commands[id]
        if (!cmd?.run) {
            console.warn(`Command ${id} not found or has no run function`)
            return
        }
        try {
            return await Promise.resolve(cmd.run())
        } catch (error) {
            console.error(`Error running command ${id}:`, error)
            throw error
        }
    },

    setContext: (partial: Partial<CommandContext>) =>
        set((state) => ({
            context: { ...state.context, ...partial },
        })),
}))

export default useCommandRegistry
