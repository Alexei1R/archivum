import { useEffect } from "react"
import { useCommandRegistry } from "../store/registry.store"
import type { CommandContext, Command } from "../types/command.types"

export const useRegisterCommands = (
    factory: (ctx: CommandContext) => Command[] | Promise<Command[]>,
) => {
    const ctx = useCommandRegistry((s) => s.context)
    const register = useCommandRegistry((s) => s.register)
    const unregister = useCommandRegistry((s) => s.unregister)

    useEffect(() => {
        let registeredIds: string[] = []

        const load = async () => {
            try {
                const commands = await factory(ctx)
                registeredIds = commands.map(cmd => {
                    register(cmd)
                    return cmd.id
                })
            } catch (error) {
                console.error("Failed to register commands:", error)
            }
        }

        load()

        return () => {
            registeredIds.forEach(id => unregister(id))
        }
    }, [ctx, register, unregister])
}
