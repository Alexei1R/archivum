import type { ServiceResult } from "@/shared/types";
import { api } from "@/shared/services";
import type { CreateWorkspaceRequest, Workspace } from "../types/workspace.types";

export const WORKSPACE_ROUTES = {
    BASE: "/workspaces",
    SEARCH: "/workspaces/search",
    BY_ID: (workspaceId: string) => `/workspaces/${workspaceId}`,
};
class WorkspaceService {

    async create(request: CreateWorkspaceRequest): Promise<ServiceResult<Workspace>> {
        try {
            const { data } = await api.post<Workspace>(WORKSPACE_ROUTES.BASE, request);
            return { data, success: true };
        } catch (error: any) {
            return {
                error: this.handleError(error, "create workspace"),
                success: false,
            };
        }
    }


    async list(): Promise<ServiceResult<Workspace[]>> {
        try {
            const { data } = await api.get<Workspace[]>(WORKSPACE_ROUTES.BASE);
            return { data, success: true };
        } catch (error: any) {
            return {
                error: this.handleError(error, "list workspaces"),
                success: false,
            };
        }
    }



    async delete(workspaceId: string): Promise<ServiceResult<void>> {
        try {
            await api.delete(WORKSPACE_ROUTES.BY_ID(workspaceId));
            return { data: undefined, success: true };
        } catch (error: any) {
            return {
                error: this.handleError(error, "delete workspace"),
                success: false,
            };
        }
    }




    private handleError(error: any, operation: string): string {
        return error?.response?.data?.message ||
            error?.message ||
            `Failed to ${operation}`;
    }
}

export const workspaceService = new WorkspaceService();
