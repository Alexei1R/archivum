import { useCommandRegistry } from "../store/registry.store"
import type { CommandContext } from "../types/command.types"

export const useCommandContext = () => {
    const ctx = useCommandRegistry((s) => s.context)
    const setContext = useCommandRegistry((s) => s.setContext)
    const setScope = useCommandRegistry((s) => s.setScope)
    return { ctx, setContext, setScope }
}

export type { CommandContext }
