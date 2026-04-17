import { ErrorBoundary } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes.constants";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Layout } from "./layout";
import { CommandBoundary } from "./boundary";
import { AuthProtected } from "@/features/auth/protected";

export const router = createBrowserRouter([
    {
        element: <CommandBoundary />,
        errorElement: <ErrorBoundary />,
        children: [
            {
                element: <AuthProtected />,
                children: [
                    {
                        element: <Layout />,
                        children: [
                            {
                                path: ROUTES.EDITOR,
                                element: <Outlet />, //NOTE: groups /editor and /editor/:id
                                children: [
                                    {
                                        index: true,
                                        lazy: () => import("@/features/editor/editor.page"),
                                    },
                                    {
                                        path: ":id",
                                        lazy: () => import("@/features/editor/editor.page"),
                                    },
                                ],
                            },
                            {
                                path: ROUTES.DOCUMENTATION,
                                lazy: () => import("@/features/docs/docs.page"),
                            },
                            {
                                path: ROUTES.PROJECTS,
                                lazy: () => import("@/features/projects/projects.page"),
                            },
                            {
                                path: ROUTES.WORKSPACE,
                                lazy: () => import("@/features/workspace/workspace.page"),
                            },
                            {
                                path: ROUTES.SETTINGS,
                                lazy: () => import("@/features/settings/settings.page"),
                            },
                        ],
                    },
                ],
            },
            {
                path: ROUTES.AUTH,
                lazy: () => import("@/features/auth/auth.page"),
            },
            {
                path: "*",
                element: <Navigate to={ROUTES.PROJECTS} replace />,
            },
        ],
    },
]);
