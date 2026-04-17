import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkspaceRequest, Workspace } from "../../types/workspace.types";
import { WORKSPACE_QUERY_KEYS } from "../../constants/workspace.constants";
import { workspaceService } from "../../services/workspace.service";
import { useWorkspaceStore } from "../../store";
import { toast } from "sonner";

export const useCreateWorkspace = () => {
    const { addWorkspace, reset } = useWorkspaceStore();
    const queryClient = useQueryClient();

    const mutation = useMutation<Workspace, Error, CreateWorkspaceRequest>({
        mutationKey: [WORKSPACE_QUERY_KEYS.CREATE],
        mutationFn: async (request) => {
            if (!request) throw new Error("Missing create workspace request");
            const response = await workspaceService.create(request);
            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to create workspace");
            }
            return response.data;
        },
        onSuccess: (data) => {
            addWorkspace(data);
            queryClient.invalidateQueries({ queryKey: [WORKSPACE_QUERY_KEYS.LIST] });
            toast.success("Workspace created");
        },
        onError: (err) => {
            reset();
            toast.error(err.message || "Failed to create workspace");
            toast.error("Please try again with a different name");
        },
    });

    return {
        workspace: mutation.data,
        isLoading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        create: mutation.mutate, //NOTE: pass CreateWorkspaceRequest when calling
    };
};
