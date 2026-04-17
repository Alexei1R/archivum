import { Search, Link } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Command } from "@/shared/components/ui/command";
import { useCommandState } from "../store";
import type { Command as CommandType } from "../types";
import { useCommandRegistry } from "../store/registry.store";

const GROUP_LABELS: Record<string, string> = {
    navigation: "Navigation",
    actions: "Actions",
    settings: "Settings",
    help: "Help & Support",
    other: "Other",
};

export default function CommandPalette() {
    const open = useCommandState((s) => s.open);
    const openPalette = useCommandState((s) => s.openPalette);
    const closePalette = useCommandState((s) => s.closePalette);

    const commandsMap = useCommandRegistry((s) => s.commands);
    const run = useCommandRegistry((s) => s.run);

    const commands = useMemo(() => Object.values(commandsMap), [commandsMap]);

    const groupOrder = useMemo(() => {
        return Array.from(new Set(commands.map((c) => c.group ?? "other")));
    }, [commands]);

    const grouped = useMemo(() => {
        return commands.reduce<Record<string, CommandType[]>>((acc, c) => {
            const g = c.group ?? "other";
            if (!acc[g]) acc[g] = [];
            acc[g].push(c);
            return acc;
        }, {});
    }, [commands]);

    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            if (isOpen) openPalette();
            else closePalette();
        },
        [openPalette, closePalette]
    );

    const handleCommandSelect = useCallback(
        async (commandId: string) => {
            closePalette();
            try {
                await run(commandId);
            } catch (error) {
                console.error("Command execution failed:", error);
            }
        },
        [closePalette, run]
    );

    return (
        <Command.Dialog open={open} onOpenChange={handleOpenChange} className="!max-w-2xl !w-[90vw]">
            <Command.Input placeholder="Search commands..." className="h-8 text-sm px-3" />
            <Command.List className="p-1 max-h-90 scrollbar-hide">
                <Command.Empty className="py-6 text-muted-foreground flex items-center justify-center">
                    <Search className="w-6 h-6 mr-2 opacity-50" />
                    <span>No results found.</span>
                </Command.Empty>
                {groupOrder.map((group) => (
                    <Command.Group heading={GROUP_LABELS[group] ?? group} key={group} className="mb-1 px-1">
                        {(grouped[group] ?? []).map((cmd) => (
                            <Command.Item
                                key={cmd.id}
                                value={cmd.name}
                                keywords={cmd.keywords}
                                onSelect={() => handleCommandSelect(cmd.id)}
                                className="flex items-center rounded-md hover:bg-accent/50 transition-colors px-1 py-1 min-h-0"
                            >
                                <div
                                    className={`w-6 h-6 rounded-md ${cmd.color ?? "bg-brand"} flex items-center justify-center flex-shrink-0`}
                                >
                                    {cmd.icon ?? <Link className="w-5 h-5 opacity-70" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm leading-tight">{cmd.name}</div>
                                    {cmd.description && (
                                        <div className="text-xs text-muted-foreground truncate leading-tight">{cmd.description}</div>
                                    )}
                                </div>
                                {cmd.shortcut && <Command.Shortcut className="text-xs">{cmd.shortcut}</Command.Shortcut>}
                            </Command.Item>
                        ))}
                    </Command.Group>
                ))}
            </Command.List>
            <div className="border-t p-1">
                <div className="flex items-center justify-between m-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-bold">Fuse</span>
                    </div>
                    <div className="flex items-center">
                        <div className="text-xs text-muted-foreground">
                            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd> to select
                        </div>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
}
