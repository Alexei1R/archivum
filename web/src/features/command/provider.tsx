import { useEffect, type PropsWithChildren } from "react"
import { hotkeyManager } from "@/shared/services/hotkey.service"
import { useCommandState } from "./store"
import CommandPalette from "./components/command"
import { useNavigate } from "react-router-dom"
import { useCommandRegistry } from "./store/registry.store"
import { useRegisterCommands } from "./hooks/use-register-command"
import { NavigationProvider } from "./providers"

const CommandProvider = ({ children }: PropsWithChildren) => {
    const togglePalette = useCommandState((s) => s.togglePalette)
    const closePalette = useCommandState((s) => s.closePalette)
    const setContext = useCommandRegistry((s) => s.setContext)
    const setScope = useCommandRegistry((s) => s.setScope)
    const navigate = useNavigate()

    useEffect(() => {
        setContext({ navigate, scope: "global" })
        setScope("global")
    }, [setContext, setScope, navigate])

    useEffect(() => {
        const unregisterCmdK = hotkeyManager.register({
            combo: "cmd+k",
            handler: togglePalette,
            description: "Command Palette",
            scope: "global",
            priority: 1000,
            preventDefault: "always",
            stopPropagation: true,
        })

        const unregisterSpaceSpace = hotkeyManager.register({
            combo: "space space",
            handler: togglePalette,
            description: "Command Palette",
            scope: "global",
            priority: 1000,
            sequence: true,
            preventDefault: "always",
            stopPropagation: true,
        })

        const unregisterEscape = hotkeyManager.register({
            combo: "escape",
            handler: closePalette,
            description: "Close Command Palette",
            scope: "global",
            priority: 1001,
            preventDefault: "always",
            stopPropagation: true,
        })

        return () => {
            unregisterCmdK()
            unregisterSpaceSpace()
            unregisterEscape()
        }
    }, [togglePalette, closePalette])

    useRegisterCommands((ctx) => NavigationProvider.getCommands(ctx))

    return (
        <>
            {children}
            <CommandPalette />
        </>
    )
}

export { CommandProvider }
