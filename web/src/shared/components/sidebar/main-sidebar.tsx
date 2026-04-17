import { Sidebar } from "@/shared/components/ui/sidebar";
import { Button } from "@/shared/components/ui/button";
import { Sheet } from "@/shared/components/ui/sheet";
import { CalendarDays, Home, Landmark, LogOut, Map, RouteIcon, Shield } from "lucide-react";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants";
import { useIsMobile } from "@/shared/hooks";
import { useAuthActions, useAuthStore } from "@/features/auth";
import { Avatar } from "@/shared/components/ui/avatar";
import { getInitials } from "@/shared/utils";
import { cn } from "@/shared/utils";

interface Route {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const routes: Route[] = [
    { name: "Home", path: ROUTES.HOME, icon: <Home size={16} /> },
    { name: "Museums", path: ROUTES.MUSEUMS, icon: <Landmark size={16} /> },
    { name: "Map", path: ROUTES.MAP, icon: <Map size={16} /> },
    { name: "Events", path: ROUTES.EVENTS, icon: <CalendarDays size={16} /> },
    { name: "Routes", path: ROUTES.ROUTES, icon: <RouteIcon size={16} /> },
    { name: "Admin", path: ROUTES.ADMIN, icon: <Shield size={16} /> },
];

const MainSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { logout, isLoggingOut } = useAuthActions();
    const user = useAuthStore(state => state.user) || {
        avatar: "https://github.com/shadcn.png",
        name: "Guest User",
        email: "guest@gmail.com",
    };

    return (
        <Sidebar.Content className={isMobile ? "items-stretch px-4 pb-4 pt-10" : "pt-3"}>
            {isMobile && (
                <div className="flex w-full items-center gap-4 border-b border-border/60 pb-6">
                    <Avatar className="h-10 w-10">
                        <Avatar.Image src={user.avatar} />
                        <Avatar.Fallback className="text-sm">
                            {getInitials(user.name)}
                        </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-foreground">{user.name}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            )}

            <div className={isMobile ? "flex w-full flex-col gap-3" : undefined}>
                {routes.map((route) => {
                    const isActive = location.pathname === route.path;
                    const routeButton = (
                        <Button
                            variant={isMobile ? "ghost" : isActive ? "secondary" : "ghost"}
                            onClick={() => navigate(route.path)}
                            size={isMobile ? "sm" : "icon"}
                            className={isMobile ? cn(
                                "relative h-10 w-full justify-start gap-3 px-3 text-sm",
                                isActive && "after:absolute after:bottom-0 after:left-3 after:h-px after:w-4 after:rounded-full after:bg-brand"
                            ) : undefined}
                        >
                            {route.icon}
                            {isMobile && <span>{route.name}</span>}
                        </Button>
                    );

                    return (
                        <Sidebar.Item key={route.name} asChild>
                            {isMobile ? (
                                <Sheet.Close asChild>
                                    {routeButton}
                                </Sheet.Close>
                            ) : routeButton}
                        </Sidebar.Item>
                    );
                })}
            </div>

            {isMobile && (
                <div className="mt-auto w-full border-t border-border/60 pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => logout()}
                        disabled={isLoggingOut}
                        className="h-11 w-full justify-start gap-3 px-4 text-base text-destructive hover:text-destructive"
                    >
                        <LogOut size={16} />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                    </Button>
                </div>
            )}
        </Sidebar.Content>
    );
};

export { MainSidebar };
