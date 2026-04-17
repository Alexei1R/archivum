import type React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Header, Profile } from "@/shared/components";
import { ROUTES } from "@/shared/constants";
import { Bell } from "lucide-react";
import ThemeSwitcher from "../theme/theme-switcher";

const MainHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Header>
            <Header.Content variant="default">
                <Header.Logo
                    title="fuse"
                    onClick={() => {
                        navigate(ROUTES.ROUTES);
                    }} />

                <Header.Group className="ml-4">
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
