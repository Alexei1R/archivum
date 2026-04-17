import type React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Header, Profile } from "@/shared/components";
import { ROUTES } from "@/shared/constants";
import { Bell } from "lucide-react";
import ThemeSwitcher from "../theme/theme-switcher";
import { WorkspaceSelector } from "./workspace-selector";

const MainHeader: React.FC = () => {

    const location = useLocation();
    const isEditorPage = location.pathname.startsWith(ROUTES.EDITOR);

    const navigate = useNavigate();


    return (
        <Header>
            <Header.Content
                variant={isEditorPage ? "floating" : "default"}
            >
                <Header.Logo
                    title={isEditorPage ? "" : "fuse"}
                    onClick={() => {
                        navigate(ROUTES.PROJECTS);
                    }} />

                <Header.Group className="ml-4">
                    <WorkspaceSelector />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-accent hover:text-accent-foreground "
                    >
                        <div className="relative flex items-center justify-center">
                            <Bell />
                            <div className="absolute -top-1  -right-1 rounded-full h-1 w-1 bg-red-500/80" />
                        </div>
                    </Button>
                    <ThemeSwitcher variant="icon" />
                    <Profile />
                </Header.Group>
            </Header.Content>
        </Header>
    );
};

export { MainHeader };
