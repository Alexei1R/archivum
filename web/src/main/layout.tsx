import { MainHeader, MainSidebar } from "@/shared/components";
import { Sidebar } from "@/shared/components/ui/sidebar";
import { ROUTES } from "@/shared/constants";
import { Outlet, useLocation } from "react-router-dom";

export const Layout = () => {
    const location = useLocation()
    return (
        <div className="flex flex-col h-screen w-screen">
            <MainHeader />
            <div className="flex-1 flex flex-row overflow-hidden">
                {location.pathname !== ROUTES.EDITOR && (
                    <Sidebar width="2.5rem">
                        <MainSidebar />
                    </Sidebar>
                )}

                <Sidebar.Inset rounded="tl">
                    <Outlet />
                </Sidebar.Inset>
            </div>
        </div>
    );
};
