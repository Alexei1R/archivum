"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/shared/utils";

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;
type DrawerTriggerProps = React.ComponentProps<typeof DrawerPrimitive.Trigger>;
type DrawerCloseProps = React.ComponentProps<typeof DrawerPrimitive.Close>;
type DrawerPortalProps = React.ComponentProps<typeof DrawerPrimitive.Portal>;
type DrawerOverlayProps = React.ComponentProps<typeof DrawerPrimitive.Overlay>;
type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content>;
type DrawerTitleProps = React.ComponentProps<typeof DrawerPrimitive.Title>;
type DrawerDescriptionProps = React.ComponentProps<typeof DrawerPrimitive.Description>;
type DivProps = React.ComponentProps<"div">;

const DrawerRoot: React.FC<DrawerProps> = ({ ...props }) => {
    return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
};

const DrawerTrigger: React.FC<DrawerTriggerProps> = ({ ...props }) => {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
};

const DrawerClose: React.FC<DrawerCloseProps> = ({ ...props }) => {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
};

const DrawerPortal: React.FC<DrawerPortalProps> = ({ ...props }) => {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
};

const DrawerOverlay: React.FC<DrawerOverlayProps> = ({ className, ...props }) => {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            className={cn("fixed inset-0 z-50 bg-black/50", className)}
            {...props}
        />
    );
};

const DrawerContent: React.FC<DrawerContentProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                className={cn(
                    "fixed inset-x-0 bottom-0 z-50 flex max-h-[96vh] flex-col rounded-t-2xl border bg-background shadow-lg outline-none",
                    className
                )}
                {...props}
            >
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                {children}
            </DrawerPrimitive.Content>
        </DrawerPortal>
    );
};

const DrawerHeader: React.FC<DivProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="drawer-header"
            className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
            {...props}
        />
    );
};

const DrawerFooter: React.FC<DivProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="drawer-footer"
            className={cn("mt-auto flex flex-col gap-2 p-4", className)}
            {...props}
        />
    );
};

const DrawerTitle: React.FC<DrawerTitleProps> = ({ className, ...props }) => {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn("text-lg font-semibold text-foreground", className)}
            {...props}
        />
    );
};

const DrawerDescription: React.FC<DrawerDescriptionProps> = ({
    className,
    ...props
}) => {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
};

const Drawer: React.FC<DrawerProps> & {
    Trigger: React.FC<DrawerTriggerProps>;
    Close: React.FC<DrawerCloseProps>;
    Portal: React.FC<DrawerPortalProps>;
    Overlay: React.FC<DrawerOverlayProps>;
    Content: React.FC<DrawerContentProps>;
    Header: React.FC<DivProps>;
    Footer: React.FC<DivProps>;
    Title: React.FC<DrawerTitleProps>;
    Description: React.FC<DrawerDescriptionProps>;
} = Object.assign(DrawerRoot, {
    Trigger: DrawerTrigger,
    Close: DrawerClose,
    Portal: DrawerPortal,
    Overlay: DrawerOverlay,
    Content: DrawerContent,
    Header: DrawerHeader,
    Footer: DrawerFooter,
    Title: DrawerTitle,
    Description: DrawerDescription,
});

export { Drawer };
