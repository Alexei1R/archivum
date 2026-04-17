import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";

const alertVariants = cva(
    "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
    {
        variants: {
            variant: {
                default: "bg-popover text-popover-foreground",
                destructive:
                    "text-destructive bg-popover [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>;
type AlertTitleProps = React.ComponentProps<"div">;
type AlertDescriptionProps = React.ComponentProps<"div">;

const AlertRoot: React.FC<AlertProps> = ({ className, variant, ...props }) => {
    return (
        <div
            data-slot="alert"
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
};

const AlertTitle: React.FC<AlertTitleProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="alert-title"
            className={cn(
                "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
                className
            )}
            {...props}
        />
    );
};

const AlertDescription: React.FC<AlertDescriptionProps> = ({ className, ...props }) => {
    return (
        <div
            data-slot="alert-description"
            className={cn(
                "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
                className
            )}
            {...props}
        />
    );
};

const Alert: React.FC<AlertProps> & {
    Title: React.FC<AlertTitleProps>;
    Description: React.FC<AlertDescriptionProps>;
} = Object.assign(AlertRoot, {
    Title: AlertTitle,
    Description: AlertDescription,
});

export { Alert };
