import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/shared/utils";

type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root>;
type DropdownMenuPortalProps = React.ComponentProps<typeof DropdownMenuPrimitive.Portal>;
type DropdownMenuTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>;
type DropdownMenuContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.Group>;
type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
};
type DropdownMenuCheckboxItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>;
type DropdownMenuRadioGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;
type DropdownMenuRadioItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>;
type DropdownMenuLabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
};
type DropdownMenuSeparatorProps = React.ComponentProps<typeof DropdownMenuPrimitive.Separator>;
type DropdownMenuShortcutProps = React.ComponentProps<"span">;
type DropdownMenuSubProps = React.ComponentProps<typeof DropdownMenuPrimitive.Sub>;
type DropdownMenuSubTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
};
type DropdownMenuSubContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>;

const DropdownMenuRoot: React.FC<DropdownMenuProps> = ({ ...props }) => {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
};

const DropdownMenuPortal: React.FC<DropdownMenuPortalProps> = ({ ...props }) => {
    return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
};

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ ...props }) => {
    return (
        <DropdownMenuPrimitive.Trigger className="focus:outline-none" data-slot="dropdown-menu-trigger" {...props} />
    );
};

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ className, sideOffset = 4, ...props }) => {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(
                    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-md",
                    className
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
};

const DropdownMenuGroup: React.FC<DropdownMenuGroupProps> = ({ ...props }) => {
    return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
};

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
    className,
    inset,
    variant = "default",
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(
                "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        />
    );
};

const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({
    className,
    children,
    checked,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(
                "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            checked={checked}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
};

const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = ({ ...props }) => {
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
};

const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({ className, children, ...props }) => {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CircleIcon className="size-2 fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
};

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ className, inset, ...props }) => {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
            {...props}
        />
    );
};

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className, ...props }) => {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("bg-border -mx-1 my-1 h-px", className)}
            {...props}
        />
    );
};

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ className, ...props }) => {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
            {...props}
        />
    );
};

const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ ...props }) => {
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
};

const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
    className,
    inset,
    children,
    ...props
}) => {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(
                "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
                className
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ml-auto size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
};

const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({ className, ...props }) => {
    return (
        <DropdownMenuPrimitive.SubContent
            data-slot="dropdown-menu-sub-content"
            className={cn(
                "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
                className
            )}
            {...props}
        />
    );
};

const DropdownMenu: React.FC<DropdownMenuProps> & {
    Portal: React.FC<DropdownMenuPortalProps>;
    Trigger: React.FC<DropdownMenuTriggerProps>;
    Content: React.FC<DropdownMenuContentProps>;
    Group: React.FC<DropdownMenuGroupProps>;
    Label: React.FC<DropdownMenuLabelProps>;
    Item: React.FC<DropdownMenuItemProps>;
    CheckboxItem: React.FC<DropdownMenuCheckboxItemProps>;
    RadioGroup: React.FC<DropdownMenuRadioGroupProps>;
    RadioItem: React.FC<DropdownMenuRadioItemProps>;
    Separator: React.FC<DropdownMenuSeparatorProps>;
    Shortcut: React.FC<DropdownMenuShortcutProps>;
    Sub: React.FC<DropdownMenuSubProps>;
    SubTrigger: React.FC<DropdownMenuSubTriggerProps>;
    SubContent: React.FC<DropdownMenuSubContentProps>;
} = Object.assign(DropdownMenuRoot, {
    Portal: DropdownMenuPortal,
    Trigger: DropdownMenuTrigger,
    Content: DropdownMenuContent,
    Group: DropdownMenuGroup,
    Label: DropdownMenuLabel,
    Item: DropdownMenuItem,
    CheckboxItem: DropdownMenuCheckboxItem,
    RadioGroup: DropdownMenuRadioGroup,
    RadioItem: DropdownMenuRadioItem,
    Separator: DropdownMenuSeparator,
    Shortcut: DropdownMenuShortcut,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
});

export { DropdownMenu };
