import { ROUTES } from "@/shared/constants/routes.constants"
import type { Command, CommandContext } from "../types"

const routeLabels: Record<string, string> = {
    PROJECTS: "Projects",
    DOCUMENTATION: "Documentation",
    EDITOR: "Editor",
    SETTINGS: "Settings"
}

const buildRouteCommands = (ctx: CommandContext): Command[] => {
    const entries = Object.entries(ROUTES) as [string, string][]

    return entries.map(([key, path]) => ({
        id: `navigate:${key}`,
        name: `Go to ${routeLabels[key] || key}`,
        description: `Navigate to ${routeLabels[key] || key.toLowerCase()} page`,
        group: "navigation",
        keywords: [key.toLowerCase(), routeLabels[key]?.toLowerCase() || "", "go", "navigate"],
        color: "bg-blue-500/20",
        run: () => {
            if (!ctx.navigate) {
                console.error("Navigate function not available")
                return
            }
            ctx.navigate(path)
        },
        scope: "global",
    }))
}

export const NavigationProvider = {
    getCommands: (ctx: CommandContext) => buildRouteCommands(ctx),
}
