import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WORKSPACE_QUERY_KEYS } from "../../constants/workspace.constants";
import { workspaceService } from "../../services/workspace.service";
import { useWorkspaceStore } from "../../store";
import { toast } from "sonner";

interface DeleteWorkspaceRequest {
    workspaceId: string;
}

export const useDeleteWorkspace = () => {
    const { deleteWorkspace, reset } = useWorkspaceStore();
    const queryClient = useQueryClient();

    const mutation = useMutation<void, Error, DeleteWorkspaceRequest>({
        mutationKey: [WORKSPACE_QUERY_KEYS.DELETE],
        mutationFn: async (request) => {
            if (!request) throw new Error("Missing delete workspace request");
            const response = await workspaceService.delete(request.workspaceId);
            if (!response.success) {
                throw new Error(response.error || "Failed to delete workspace");
            }
        },
        onSuccess: (_, variables) => {
            deleteWorkspace(variables.workspaceId);
            queryClient.invalidateQueries({ queryKey: [WORKSPACE_QUERY_KEYS.LIST] });
            toast.success("Workspace deleted");
        },
        onError: (err) => {
            reset();
            toast.error(err.message || "Failed to delete workspace");
        },
    });

    return {
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        delete: mutation.mutate,
    };
};
