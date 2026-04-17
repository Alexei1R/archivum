
import { useAlert } from "@/shared/hooks";
import React from "react";
import { useDeleteWorkspace } from "../../hooks/api/workspace.delete";
import { useListWorkspaces } from "../../hooks/api/workspace.list";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Input } from "@/shared/components";
import formatDate from "../../utils/workspace.utils";
import { WorkspaceActions } from "./workspace-actions";
import { DataTable, ViewOptions } from "../tables";
import type { Workspace } from "../../types/workspace.types";
import CreateWorkspaceModal from "./create-workspace-modal";



interface WorkspacesProps {
    onRowClick?: (workspace: Workspace) => void;
}


const Workspaces: React.FC<WorkspacesProps> = ({ onRowClick }) => {

    const alert = useAlert();
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [table, setTable] = React.useState<any>(null);

    const { delete: deleteWorkspace } = useDeleteWorkspace();
    const { workspaces, isLoading: isLoadingWS } = useListWorkspaces();

    const handleDeleteWorkspace = React.useCallback((workspaceId: string) => {
        alert.custom({
            title: 'Workspace Deletion',
            message: 'This action cannot be undone. All your data will be permanently deleted.',
            confirmText: 'Delete Workspace',
            cancelText: 'Keep Workspace',
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
                deleteWorkspace({ workspaceId });
            }
        });
    }, [deleteWorkspace]);

    //NOTE: useMemo prevents infinite re-renders by providing stable reference
    const columns = React.useMemo<ColumnDef<Workspace>[]>(() => [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                return <div className="font-medium">{name}</div>;
            },
        },
        {
            accessorKey: "plan",
            header: "Plan",
            cell: ({ row }) => {
                const plan = row.getValue("plan") as string;
                return (
                    <Badge variant="secondary">
                        {plan}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => {
                const createdAt = row.getValue("created_at") as string;
                return <div className="text-sm">{formatDate(createdAt)}</div>;
            },
        },
        {
            accessorKey: "updated_at",
            header: "Updated At",
            cell: ({ row }) => {
                const updatedAt = row.getValue("updated_at") as string;
                return <div className="text-sm">{formatDate(updatedAt)}</div>;
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const workspace = row.original;
                return (
                    <WorkspaceActions handleDeleteWorkspace={handleDeleteWorkspace} workspace={workspace} />
                );
            },
        },
    ], [handleDeleteWorkspace]);

    const handleTableReady = React.useCallback((tableInstance: any) => {
        setTable(tableInstance);
    }, []);




    return (
        <div className="flex flex-col gap-y-4 max-w-4xl h-full mx-auto mt-[15vh]">
            <div className="flex items-center justify-between gap-2">
                <Input
                    placeholder="Filter workspaces..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />

                <div className="flex flex-row items-center gap-2 ">
                    <CreateWorkspaceModal />
                    {table && <ViewOptions table={table} />}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={workspaces}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                onTableReady={handleTableReady}
                onRowClick={onRowClick}
                loading={isLoadingWS}
            />
        </div>
    )

}


export default Workspaces;
