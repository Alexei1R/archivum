"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/shared/utils";

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;
type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger>;
type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>;
type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>;
type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>;
type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
};
type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>;
type DialogDescriptionProps = React.ComponentProps<typeof DialogPrimitive.Description>;
type DivProps = React.ComponentProps<"div">;

const DialogRoot: React.FC<DialogProps> = ({ ...props }) => {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
};

const DialogTrigger: React.FC<DialogTriggerProps> = ({ ...props }) => {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
};

const DialogPortal: React.FC<DialogPortalProps> = ({ ...props }) => {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
};

const DialogClose: React.FC<DialogCloseProps> = ({ ...props }) => {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
};

const DialogOverlay: React.FC<DialogOverlayProps> = ({ className, ...props }) => {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
                className
            )}
            {...props}
        />
    );
};

const DialogContent: React.FC<DialogContentProps> = ({
    className,
    children,
    showCloseButton = true,
    ...props
}) => {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
};

const DialogHeader: React.FC<DivProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
};

const DialogFooter: React.FC<DivProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="dialog-footer"
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    );
};

const DialogTitle: React.FC<DialogTitleProps> = ({ className, ...props }) => {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("text-lg leading-none font-semibold", className)}
            {...props}
        />
    );
};

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, ...props }) => {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
};

const Dialog: React.FC<DialogProps> & {
    Trigger: React.FC<DialogTriggerProps>;
    Portal: React.FC<DialogPortalProps>;
    Close: React.FC<DialogCloseProps>;
    Overlay: React.FC<DialogOverlayProps>;
    Content: React.FC<DialogContentProps>;
    Header: React.FC<DivProps>;
    Footer: React.FC<DivProps>;
    Title: React.FC<DialogTitleProps>;
    Description: React.FC<DialogDescriptionProps>;
} = Object.assign(DialogRoot, {
    Trigger: DialogTrigger,
    Portal: DialogPortal,
    Close: DialogClose,
    Overlay: DialogOverlay,
    Content: DialogContent,
    Header: DialogHeader,
    Footer: DialogFooter,
    Title: DialogTitle,
    Description: DialogDescription,
});

export { Dialog };
