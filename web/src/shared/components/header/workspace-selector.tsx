import { useListWorkspaces, useWorkspaceStore } from "@/features/workspace";
import CreateWorkspaceModal from "@/features/workspace/components/workspaces/create-workspace-modal";
import { Button, DropdownMenu } from "@/shared/components";
import { Layers } from "lucide-react";




const WorkspaceSelector = () => {
    const currentWorkspace = useWorkspaceStore(store => store.currentWorkspace);
    const setCurrentWorkspace = useWorkspaceStore(store => store.setCurrentWorkspace);
    const { workspaces, isLoading: isLoadingWS } = useListWorkspaces();
    return (

        <DropdownMenu >
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="outline"
                    className="ml-auto !min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Layers className="h-4 w-4" />
                    {currentWorkspace ? (
                        <span className="ml-2">{currentWorkspace.name}</span>
                    ) : isLoadingWS ? (
                        <span className="ml-2 animate-pulse text-gray-500">Loading...</span>
                    ) : (
                        <span className="ml-2 text-gray-500">No Workspace</span>
                    )}
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                onClick={(e) => e.stopPropagation()}
            >
                {workspaces.map((ws) => (
                    <DropdownMenu.Item
                        key={ws.id}
                        onClick={() => setCurrentWorkspace(ws)}
                    >
                        {ws.name}
                    </DropdownMenu.Item>
                ))}

                <DropdownMenu.Separator />
                <DropdownMenu.Item asChild >
                    <CreateWorkspaceModal className="bg-brand/10 outline-0 border-0 " />
                </DropdownMenu.Item>

            </DropdownMenu.Content>


        </DropdownMenu>

    );
}

export { WorkspaceSelector };
