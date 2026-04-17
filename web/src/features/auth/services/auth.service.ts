import type { ServiceResult } from "@/shared/types";
import type { LogoutResponse, User } from "../types/auth.types";
import { api } from "@/shared/services";


// r.Get("/{provider}", h.BeginAuth)
// r.Get("/{provider}/callback", h.AuthCallback)
// r.Post("/logout", h.Logout)
// r.Get("/status", h.GetAuthStatus)



const AUTH_ROUTES = {
    OAUTH: (provider: string) => `/auth/${provider}`,
    LOGOUT: "/auth/logout",
    STATUS: "/auth/status",
};

class AuthService {
    async getStatus(): Promise<ServiceResult<User>> {
        try {
            const { data } = await api.get<User>(AUTH_ROUTES.STATUS);
            return { data, success: true };
        } catch (error: any) {

            console.log("Auth status error:", error)
            return {
                error: this.handleError(error, "get auth status"),
                success: false,
            };
        }
    }

    async logout(): Promise<ServiceResult<LogoutResponse>> {
        try {
            const { data } = await api.post<LogoutResponse>(AUTH_ROUTES.LOGOUT);
            return { data, success: true };
        } catch (error: any) {
            return {
                error: this.handleError(error, "logout"),
                success: false,
            };
        }
    }

    startOAuth(provider: string): void {
        if (!provider?.trim()) {
            throw new Error("Provider is required");
        }
        window.location.href = this.getLoginURL(provider);
    }


    getLoginURL(provider: string): string {
        return `${api.defaults.baseURL}${AUTH_ROUTES.OAUTH(provider)}`;
    }

    private handleError(error: any, operation: string): string {
        return error?.response?.data?.message ||
            error?.message ||
            `Failed to ${operation}`;
    }
}

export const authService = new AuthService();
