import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services";
import { useAuthStore } from "../../store";
import { AUTH_QUERY_KEYS } from "../../constants";
import { toast } from "sonner";
import type { User } from "../../types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants";

export const useAuthStatus = () => {
    const queryClient = useQueryClient();
    const { setUser, setIsAuthenticated, reset, user: storeUser, isAuthenticated: storeIsAuthed } = useAuthStore();
    const navigate = useNavigate();

    const statusQuery = useQuery<User, Error>({
        queryKey: [AUTH_QUERY_KEYS.STATUS],
        queryFn: async (): Promise<User> => {
            const response = await authService.getStatus();
            if (!response.success || !response.data) {
                console.error("Auth status fetch error:", response.error);
                throw new Error(response.error || "Failed to fetch auth status");
            }
            setUser(response.data);
            setIsAuthenticated(true);
            return response.data;
        },
        retry: false
    });

    if (statusQuery.isError && statusQuery.error) {
        reset();
        toast.error(statusQuery.error.message || "Failed to fetch auth status");
        queryClient.removeQueries({ queryKey: [AUTH_QUERY_KEYS.STATUS] });
        navigate(ROUTES.AUTH, { replace: true });
    }

    const derivedIsAuthenticated = storeIsAuthed || !!statusQuery.data || !!storeUser;
    const isReady = !(statusQuery.isLoading || statusQuery.isFetching || statusQuery.isPending);

    return {
        user: statusQuery.data ?? storeUser,
        isAuthenticated: derivedIsAuthenticated,
        isReady,
        isLoading: statusQuery.isLoading,
        isFetching: statusQuery.isFetching,
        isSuccess: statusQuery.isSuccess,
        refetch: statusQuery.refetch,
        error: statusQuery.error,
    };
};
