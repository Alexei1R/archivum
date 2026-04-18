import type React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Header, Profile } from "@/shared/components";
import { ROUTES } from "@/shared/constants";
import { Bell } from "lucide-react";
import ThemeSwitcher from "../theme/theme-switcher";

const MainHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Header className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-4 right-4 top-auto rounded-2xl border border-border/80 shadow-lg md:sticky md:left-auto md:right-auto md:top-0 md:bottom-auto md:rounded-none md:border-0 md:shadow-none">
            <Header.Content
                variant="default"
                className="h-12 px-2.5 md:h-[2.5rem] md:px-1"
            >
                <Header.Logo
                    title="fuse"
                    onClick={() => {
                        navigate(ROUTES.MAP);
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
