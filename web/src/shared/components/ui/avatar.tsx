import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/shared/utils";

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>;
type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;
type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback>;

const AvatarRoot: React.FC<AvatarProps> = ({ className, ...props }) => {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    );
};

const AvatarImage: React.FC<AvatarImageProps> = ({ className, ...props }) => {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn("aspect-square size-full", className)}
            {...props}
        />
    );
};

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, ...props }) => {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
            {...props}
        />
    );
};

const Avatar: React.FC<AvatarProps> & {
    Image: React.FC<AvatarImageProps>;
    Fallback: React.FC<AvatarFallbackProps>;
} = Object.assign(AvatarRoot, {
    Image: AvatarImage,
    Fallback: AvatarFallback,
});

export { Avatar };
