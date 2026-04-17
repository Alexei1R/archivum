import { Outlet, Navigate } from "react-router-dom";
import Loading from "@/shared/components/common/loading";
import { ROUTES } from "@/shared/constants";
import { useAuthStatus } from "./hooks";

const AuthProtected = () => {
    const { isAuthenticated, isReady } = useAuthStatus();
    if (!isReady) return <Loading overlay="fullscreen" size="sm" message="Checking authentication..." />;
    if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />;
    return <Outlet />;
};

export { AuthProtected };
