import { DropdownMenu, Button } from "@/shared/components";

import { EllipsisVertical, ListMinus } from "lucide-react";
import type React from "react";
import type { Workspace } from "../../types";


interface WorspaceActionsProps {
    handleDeleteWorkspace: (workspaceId: string) => void;
    workspace: Workspace;
}

const WorkspaceActions: React.FC<WorspaceActionsProps> = ({
    handleDeleteWorkspace,
    workspace
}) => {
    return (
        <DropdownMenu >
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="ghost"
                    className="ml-auto h-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <EllipsisVertical className="h-4 w-4" />
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                align="end"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenu.Item>
                    Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                    Change Plan
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                    Members
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    variant="destructive"
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                >
                    <ListMinus className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
};


export { WorkspaceActions };
