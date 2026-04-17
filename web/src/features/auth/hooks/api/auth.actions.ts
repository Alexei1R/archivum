import { authService } from "../../services";
import { useAuthStore } from "../../store";

import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/constants";

const useAuthActions = () => {
    const queryClient = useQueryClient();
    const resetAuth = useAuthStore((state) => state.reset);
    const navigate = useNavigate();

    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            resetAuth();
            queryClient.clear();
            navigate(ROUTES.AUTH);
        },
        onError: (error) => {
            console.error("Logout failed:", error);
        },
    });

    const startOAuth = (provider: string) => {
        try {
            authService.startOAuth(provider);
        } catch (error) {
            console.error("OAuth start failed:", error);
        }
    };

    return {
        logout: logoutMutation.mutateAsync,
        startOAuth,
        isLoggingOut: logoutMutation.isPending,
    };
};

export { useAuthActions };
