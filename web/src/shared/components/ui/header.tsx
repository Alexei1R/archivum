import * as React from "react";
import Logo from "@/shared/logo/logo";
import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";

type HeaderProps = React.ComponentProps<"header">;

type HeaderLogoProps = React.ComponentProps<"div"> & {
    icon?: React.ReactNode;
    title?: string;
};

type HeaderContentProps = React.ComponentProps<"div"> &
    VariantProps<typeof contentVariants>;

type HeaderGroupProps = React.ComponentProps<"div">;

const contentVariants = cva(
    "flex flex-1 items-center justify-between",
    {
        variants: {
            variant: {
                default: "h-[2.5rem] justify-between px-1",
                floating: cn(
                    "absolute top-1 right-1",
                    "bg-background backdrop-blur-sm",
                    "border-2 border-border",
                    "shadow-md",
                    "rounded-full",
                    "justify-end"
                ),
                clipped: cn(
                    "absolute top-0 right-0 pt-0 pr-0",
                    "bg-background backdrop-blur-sm",
                    "border-l border-b border-border rounded-bl-2xl"
                ),
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const HeaderRoot: React.FC<HeaderProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <header
            data-slot="header"
            className={cn(
                "sticky top-0 z-50 flex items-center bg-background shrink-0",
                className
            )}
            {...props}
        >
            {children}
        </header>
    );
};

const HeaderLogo: React.FC<HeaderLogoProps> = ({
    icon,
    title,
    className,
    ...props
}) => {
    return (
        <div
            data-slot="header-logo"
            className={cn("flex items-center gap-2 cursor-pointer", className)}
            {...props}
        >
            {icon ? icon : <Logo className="w-8 h-8" />}
            {title && <div className="font-semibold text-md">{title}</div>}
        </div>
    );
};

const HeaderContent: React.FC<HeaderContentProps> = ({
    className,
    children,
    variant,
    ...props
}) => {
    return (
        <div
            data-slot="header-content"
            className={cn(contentVariants({ variant }), className)}
            {...props}
        >
            {children}
        </div>
    );
};

const HeaderGroup: React.FC<HeaderGroupProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            data-slot="header-group"
            className={cn("flex items-center gap-1", className)}
            {...props}
        >
            {children}
        </div>
    );
};

const Header: React.FC<HeaderProps> & {
    Logo: React.FC<HeaderLogoProps>;
    Content: React.FC<HeaderContentProps>;
    Group: React.FC<HeaderGroupProps>;
} = Object.assign(HeaderRoot, {
    Logo: HeaderLogo,
    Content: HeaderContent,
    Group: HeaderGroup,
});

export { Header };
