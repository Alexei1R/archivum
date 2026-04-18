import { ErrorBoundary } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes.constants";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./layout";
import { AuthProtected } from "@/features/auth/protected";

export const router = createBrowserRouter([
    {
        errorElement: <ErrorBoundary />,
        hydrateFallbackElement: (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ),
        children: [
            {
                element: <AuthProtected />,
                children: [
                    {
                        element: <Layout />,
                        children: [
                            {
                                index: true,
                                lazy: () => import("@/features/map/map.page"),
                            },
                            {
                                path: ROUTES.MAP,
                                lazy: () => import("@/features/map/map.page"),
                            },
                            {
                                path: ROUTES.EVENTS,
                                lazy: () => import("@/features/events/events.page"),
                            },
                            {
                                path: ROUTES.ADMIN,
                                lazy: () => import("@/features/admin/admin.page"),
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
                element: <Navigate to={ROUTES.MAP} replace />,
            },
        ],
    },
]);
