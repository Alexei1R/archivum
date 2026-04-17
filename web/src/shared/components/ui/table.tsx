import * as React from "react";
import { cn } from "@/shared/utils";

type TableProps = React.ComponentProps<"table">;
type TableHeaderProps = React.ComponentProps<"thead">;
type TableBodyProps = React.ComponentProps<"tbody">;
type TableFooterProps = React.ComponentProps<"tfoot">;
type TableRowProps = React.ComponentProps<"tr">;
type TableHeadProps = React.ComponentProps<"th">;
type TableCellProps = React.ComponentProps<"td">;
type TableCaptionProps = React.ComponentProps<"caption">;

const TableRoot: React.FC<TableProps> = ({ className, ...props }) => {
    return (
        <div data-slot="table-container" className="relative w-full overflow-x-auto">
            <table
                data-slot="table"
                className={cn("w-full caption-bottom text-sm", className)}
                {...props}
            />
        </div>
    );
};

const TableHeader: React.FC<TableHeaderProps> = ({ className, ...props }) => {
    return (
        <thead
            data-slot="table-header"
            className={cn("[&_tr]:border-b", className)}
            {...props}
        />
    );
};

const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => {
    return (
        <tbody
            data-slot="table-body"
            className={cn("[&_tr:last-child]:border-0", className)}
            {...props}
        />
    );
};

const TableFooter: React.FC<TableFooterProps> = ({ className, ...props }) => {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    );
};

const TableRow: React.FC<TableRowProps> = ({ className, ...props }) => {
    return (
        <tr
            data-slot="table-row"
            className={cn(
                "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
                className
            )}
            {...props}
        />
    );
};

const TableHead: React.FC<TableHeadProps> = ({ className, ...props }) => {
    return (
        <th
            data-slot="table-head"
            className={cn(
                "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className
            )}
            {...props}
        />
    );
};

const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className
            )}
            {...props}
        />
    );
};

const TableCaption: React.FC<TableCaptionProps> = ({ className, ...props }) => {
    return (
        <caption
            data-slot="table-caption"
            className={cn("text-muted-foreground mt-4 text-sm", className)}
            {...props}
        />
    );
};

const Table: React.FC<TableProps> & {
    Header: React.FC<TableHeaderProps>;
    Body: React.FC<TableBodyProps>;
    Footer: React.FC<TableFooterProps>;
    Row: React.FC<TableRowProps>;
    Head: React.FC<TableHeadProps>;
    Cell: React.FC<TableCellProps>;
    Caption: React.FC<TableCaptionProps>;
} = Object.assign(TableRoot, {
    Header: TableHeader,
    Body: TableBody,
    Footer: TableFooter,
    Row: TableRow,
    Head: TableHead,
    Cell: TableCell,
    Caption: TableCaption,
});

export { Table };
