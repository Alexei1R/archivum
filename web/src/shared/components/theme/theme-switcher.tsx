import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/utils";
import useCommandRegistry from "@/features/command/store/registry.store";
import { useEffect } from "react";
import { useHotkeys, type UseHotkeyConfig } from "@/shared/hooks";
import { useTheme } from "./theme-provider";
import { Button } from "../ui";

interface Props {
    className?: string;
    disabled?: boolean;
    variant?: "icon" | "default";
}

const iconClasses = "h-4 w-4 transition-all duration-300";

export default function ThemeSwitcher({
    className,
    disabled,
    variant = "icon"
}: Props) {
    const { theme, setTheme } = useTheme();
    const toggleTheme = () => setTheme(prev => (prev === "light" ? "dark" : "light"));
    const isIconOnly = variant === "icon";
    const { register, unregister } = useCommandRegistry();

    const hotkeyConfigs: UseHotkeyConfig[] =
        [
            {
                preset: "toggleTheme",
                action: toggleTheme,
                description: "Toggle theme",
                priority: 90,
                scope: "global"
            },
        ]
    const { } = useHotkeys(hotkeyConfigs)

    useEffect(() => {
        register({
            id: "theme:toggle",
            name: "Toggle Theme",
            description: "Toggle between light and dark mode",
            group: "settings",
            keywords: ["theme", "dark", "light", "mode"],
            icon: null,
            color: null,
            shortcut: "ctrl+shift+t",
            run: () => setTheme(prev => (prev === "light" ? "dark" : "light")),
            scope: "global",
        });

        return () => unregister("theme:toggle");
    }, [register, unregister, setTheme]);

    return (
        <Button
            variant="ghost"
            size={isIconOnly ? "icon" : "sm"}
            className={cn(
                "hover:bg-accent hover:text-accent-foreground",
                className
            )}
            onClick={toggleTheme}
            disabled={disabled}
        >
            <div className="relative flex items-center justify-center">
                <Sun className={cn(iconClasses, "rotate-0 scale-100 dark:-rotate-90 dark:scale-0")} />
                <Moon className={cn(iconClasses, "absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100")} />
            </div>
            {!isIconOnly && <span className="capitalize">{theme}</span>}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
