import type React from "react";
import { AuthFooter } from "./auth-footer";
import { AuthForm } from "./auth-form";
import { AuthVisual, MobileAuthVisual } from "./auth-visual";

interface AuthProps {
    providers: string[];
    onSignIn?: (provider: string) => void;
}

const Auth: React.FC<AuthProps> = ({ providers, onSignIn }) => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[minmax(26rem,1fr)_minmax(32rem,1fr)] lg:p-6">
            <MobileAuthVisual />
            <div className="relative z-10 flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:min-h-0 lg:pb-0">
                <div className="flex flex-1 items-center justify-center pb-0">
                    <AuthForm providers={providers} onSignIn={onSignIn} />
                </div>
                <footer className="hidden px-4 lg:block">
                    <AuthFooter />
                </footer>
            </div>
            <AuthVisual />
        </div>
    );
};

export { Auth };
export type { AuthProps };
