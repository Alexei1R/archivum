import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { cn } from "@/shared/utils";
import {
    Dialog,
} from "@/shared/components/ui/dialog";

type CommandProps = React.ComponentProps<typeof CommandPrimitive>;
type CommandDialogProps = React.ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
};
type CommandInputProps = React.ComponentProps<typeof CommandPrimitive.Input>;
type CommandListProps = React.ComponentProps<typeof CommandPrimitive.List>;
type CommandEmptyProps = React.ComponentProps<typeof CommandPrimitive.Empty>;
type CommandGroupProps = React.ComponentProps<typeof CommandPrimitive.Group>;
type CommandSeparatorProps = React.ComponentProps<typeof CommandPrimitive.Separator>;
type CommandItemProps = React.ComponentProps<typeof CommandPrimitive.Item>;
type CommandShortcutProps = React.ComponentProps<"span">;

const CommandRoot: React.FC<CommandProps> = ({ className, ...props }) => {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn(
                "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
                className
            )}
            {...props}
        />
    );
};

const CommandDialog: React.FC<CommandDialogProps> = ({
    title = "Command Palette",
    description = "Search for a command to run...",
    children,
    className,
    showCloseButton = true,
    ...props
}) => {
    return (
        <Dialog {...props}>
            <Dialog.Header className="sr-only">
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Description>{description}</Dialog.Description>
            </Dialog.Header>
            <Dialog.Content className={cn("overflow-hidden p-0", className)} showCloseButton={showCloseButton}>
                <CommandRoot className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </CommandRoot>
            </Dialog.Content>
        </Dialog>
    );
};

const CommandInput: React.FC<CommandInputProps> = ({ className, ...props }) => {
    return (
        <div data-slot="command-input-wrapper" className="flex h-9 items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
                data-slot="command-input"
                className={cn(
                    "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        </div>
    );
};

const CommandList: React.FC<CommandListProps> = ({ className, ...props }) => {
    return (
        <CommandPrimitive.List
            data-slot="command-list"
            className={cn("max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
            {...props}
        />
    );
};

const CommandEmpty: React.FC<CommandEmptyProps> = ({ ...props }) => {
    return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />;
};

const CommandGroup: React.FC<CommandGroupProps> = ({ className, ...props }) => {
    return (
        <CommandPrimitive.Group
            data-slot="command-group"
            className={cn(
                "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
                className
            )}
            {...props}
        />
    );
};

const CommandSeparator: React.FC<CommandSeparatorProps> = ({ className, ...props }) => {
    return (
        <CommandPrimitive.Separator data-slot="command-separator" className={cn("bg-border -mx-1 h-px", className)} {...props} />
    );
};

const CommandItem: React.FC<CommandItemProps> = ({ className, ...props }) => {
    return (
        <CommandPrimitive.Item
            data-slot="command-item"
            className={cn(
                "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        />
    );
};

const CommandShortcut: React.FC<CommandShortcutProps> = ({ className, ...props }) => {
    return (
        <span data-slot="command-shortcut" className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)} {...props} />
    );
};

const Command: React.FC<CommandProps> & {
    Dialog: React.FC<CommandDialogProps>;
    Input: React.FC<CommandInputProps>;
    List: React.FC<CommandListProps>;
    Empty: React.FC<CommandEmptyProps>;
    Group: React.FC<CommandGroupProps>;
    Separator: React.FC<CommandSeparatorProps>;
    Item: React.FC<CommandItemProps>;
    Shortcut: React.FC<CommandShortcutProps>;
} = Object.assign(CommandRoot, {
    Dialog: CommandDialog,
    Input: CommandInput,
    List: CommandList,
    Empty: CommandEmpty,
    Group: CommandGroup,
    Separator: CommandSeparator,
    Item: CommandItem,
    Shortcut: CommandShortcut,
});

export { Command };
