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

                <Sidebar.Inset rounded="tl" className="pb-24 md:pb-0">
                    <Outlet />
                </Sidebar.Inset>
            </div>
        </div>
    );
};
