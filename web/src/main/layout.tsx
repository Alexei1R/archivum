import { MainHeader, MainSidebar } from "@/shared/components";
import { Sidebar } from "@/shared/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export const Layout = () => {
    return (
        <div className="flex flex-col h-screen w-screen">
            <MainHeader />
            <div className="flex-1 flex flex-row overflow-hidden">
                <Sidebar width="2.5rem">
                    <MainSidebar />
                </Sidebar>

                <Sidebar.Inset
                    rounded="tl"
                    className="min-h-0 overflow-hidden rounded-none border-0 md:rounded-tl-2xl md:border"
                >
                    <Outlet />
                </Sidebar.Inset>
            </div>
        </div>
    );
};
