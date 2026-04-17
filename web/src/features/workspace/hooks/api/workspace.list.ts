import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspaceStore } from "../../store";
import type { Workspace } from "../../types";
import { WORKSPACE_QUERY_KEYS } from "../../constants/workspace.constants";
import { workspaceService } from "../../services";
import React from "react";

export const useListWorkspaces = () => {
    const queryClient = useQueryClient();
    const { setWorkspaces, reset, setError, setCurrentWorkspace } = useWorkspaceStore();

    const listWsQuery = useQuery<Workspace[], Error>({
        queryKey: [WORKSPACE_QUERY_KEYS.LIST],
        queryFn: async (): Promise<Workspace[]> => {
            const response = await workspaceService.list();
            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to fetch workspaces");
            }
            setWorkspaces(response.data);
            return response.data;
        },
        retry: false
    });

    React.useEffect(() => {
        if (listWsQuery.isError && listWsQuery.error) {
            reset();
            setError(listWsQuery.error.message);
            toast.error(listWsQuery.error.message || "Failed to fetch workspaces");
            queryClient.removeQueries({ queryKey: [WORKSPACE_QUERY_KEYS.LIST] });
        }
    }, [listWsQuery.isError, listWsQuery.error, reset, setError, queryClient]);

    React.useEffect(() => {
        if (listWsQuery.isSuccess && listWsQuery.data && listWsQuery.data.length
            && !useWorkspaceStore.getState().currentWorkspace) {
            setCurrentWorkspace(listWsQuery.data[0]);
        }
    }, [listWsQuery.isSuccess, listWsQuery.data, setCurrentWorkspace]);

    return {
        isLoading: listWsQuery.isLoading,
        isFetching: listWsQuery.isFetching,
        isSuccess: listWsQuery.isSuccess,
        refetch: listWsQuery.refetch,
        error: listWsQuery.error,
        //data 
        workspaces: listWsQuery.data ?? [],
    };
}
