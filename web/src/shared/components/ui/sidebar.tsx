import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/shared/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useIsMobile } from "@/shared/hooks";
import { Sheet } from "./sheet";
import { Button } from "./button";
import { ChevronRight, CircleChevronRight } from "lucide-react";

type SidebarProps = React.ComponentProps<"div"> & {
    side?: "left" | "right";
    width?: string;
};

type SidebarContentProps = React.ComponentProps<"div">;
type SidebarHeaderProps = React.ComponentProps<"div">;
type SidebarFooterProps = React.ComponentProps<"div">;
type SidebarGroupProps = React.ComponentProps<"div">;
type SidebarItemProps = React.ComponentProps<"div"> & {
    active?: boolean;
    asChild?: boolean;
};

const insertVariants = cva(
    "flex flex-1 flex-col",
    {
        variants: {
            rounded: {
                tl: "border-1 rounded-tl-2xl border-border/50",
                tr: "border-1 rounded-tr-2xl border-border/50",
                full: "border-1 rounded-2xl border-border/50",
                none: "",
            },
        },
        defaultVariants: {
            rounded: "tl",
        },
    }
);

type SidebarInsetProps = React.ComponentProps<"main"> &
    VariantProps<typeof insertVariants>;

const SidebarRoot: React.FC<SidebarProps> = ({
    className,
    children,
    width = "16rem",
    ...props
}) => {


    const isMobile = useIsMobile()

    return (
        <>
            {isMobile ? (
                <Sheet>
                    <Sheet.Trigger asChild>
                        <Button
                            variant="ghost"
                            size="lg"
                            className={cn(
                                "absolute top-[15vh] left-0 z-50  w-8 h-8 rounded-none rounded-r-xl hover:scale-105  -translate-x-2 hover:-translate-x-0 transition-all ease-in-out",
                                "bg-brand/10 hover:bg-blue-500/30 ",
                            )}
                        >
                            <ChevronRight />
                        </Button>
                    </Sheet.Trigger>
                    <Sheet.Content
                        showClose={false}
                        side="left"
                        className={cn(
                            "bg-background flex h-full flex-col items-start min-w-[12rem]",
                            className
                        )}
                        style={{ width: width } as React.CSSProperties}
                        {...props}
                    >
                        {children}
                    </Sheet.Content>


                </Sheet>

            ) : (
                <div
                    data-slot="sidebar"
                    style={{
                        width: width,
                    } as React.CSSProperties}
                    className={cn(
                        "bg-background flex h-full flex-col",
                        className
                    )}
                    {...props}
                >
                    {children}
                </div>
            )}
        </>
    );
};

const SidebarContent: React.FC<SidebarContentProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            data-slot="sidebar-content"
            className={cn(
                "flex flex-1 flex-col overflow-y-auto p-2 items-center overflow-hidden",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            data-slot="sidebar-header"
            className={cn(
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const SidebarFooter: React.FC<SidebarFooterProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            data-slot="sidebar-footer"
            className={cn(
                "p-4",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const SidebarGroup: React.FC<SidebarGroupProps> = ({
    className,
    children,
    ...props
}) => {
    return (
        <div
            data-slot="sidebar-group"
            className={cn(
                "space-y-2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const SidebarItem: React.FC<SidebarItemProps> = ({
    className,
    children,
    active = false,
    asChild = false,
    ...props
}) => {
    const Comp = asChild ? Slot : "div";

    return (
        <Comp
            data-slot="sidebar-item"
            data-active={active}
            className={cn(
                "hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md p-2 text-sm transition-colors cursor-pointer ",
                active && "bg-accent text-accent-foreground font-medium ",
                className
            )}
            {...props}
        >
            {children}
        </Comp>
    );
};

const SidebarInset: React.FC<SidebarInsetProps> = ({
    className,
    children,
    rounded = "tl",
    ...props
}) => {
    return (
        <main
            data-slot="sidebar-inset"
            className={cn(
                insertVariants({ rounded }),
                className
            )}
            {...props}
        >
            {children}
        </main>
    );
};

const Sidebar: React.FC<SidebarProps> & {
    Content: React.FC<SidebarContentProps>;
    Header: React.FC<SidebarHeaderProps>;
    Footer: React.FC<SidebarFooterProps>;
    Group: React.FC<SidebarGroupProps>;
    Item: React.FC<SidebarItemProps>;
    Inset: React.FC<SidebarInsetProps>;
} = Object.assign(SidebarRoot, {
    Content: SidebarContent,
    Header: SidebarHeader,
    Footer: SidebarFooter,
    Group: SidebarGroup,
    Item: SidebarItem,
    Inset: SidebarInset,
});

export { Sidebar };
