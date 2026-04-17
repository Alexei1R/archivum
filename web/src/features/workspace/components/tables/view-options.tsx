import { type Table } from "@tanstack/react-table";
import { Button, DropdownMenu } from "@/shared/components";
import { Settings2Icon } from "lucide-react";
import { useState, useEffect } from "react";

interface ViewOptionsProps<TData> {
    table: Table<TData>;
}

export function ViewOptions<TData>({ table }: ViewOptionsProps<TData>) {
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        table.getAllColumns()
            .filter((column) => column.getCanHide())
            .forEach((column) => {
                initialVisibility[column.id] = column.getIsVisible();
            });
        setColumnVisibility(initialVisibility);
    }, [table]);

    const handleToggleColumn = (columnId: string) => {
        const column = table.getColumn(columnId);
        if (column) {
            const newVisibility = !column.getIsVisible();
            column.toggleVisibility(newVisibility);
            setColumnVisibility(prev => ({
                ...prev,
                [columnId]: newVisibility
            }));
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-8">
                    <Settings2Icon className="h-4 w-4" />
                    View
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="max-w-48">
                <DropdownMenu.Label>Toggle columns</DropdownMenu.Label>
                <DropdownMenu.Separator />
                {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                        <DropdownMenu.CheckboxItem
                            key={column.id}
                            checked={columnVisibility[column.id] ?? column.getIsVisible()}
                            onCheckedChange={() => handleToggleColumn(column.id)}
                            className="capitalize "

                        >
                            {column.id.replace(/_/g, " ")}
                        </DropdownMenu.CheckboxItem>
                    ))}
            </DropdownMenu.Content>
        </DropdownMenu>
    );
}
