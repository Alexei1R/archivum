import { Button } from "@/shared/components";
import { cn } from "@/shared/utils";
import type React from "react";

interface AuthProps {
    providers: string[];
    onSignIn?: (provider: string) => void;
}

const formatProvider = (provider: string) =>
    provider.charAt(0).toUpperCase() + provider.slice(1);

interface AuthFormProps extends AuthProps {
    className?: string;
}

const AuthFooter = () => {
    return (
        <div className="py-6 text-center text-xs text-muted-foreground">
            <div className="mb-3 flex justify-center space-x-6">
                <a
                    href="#"
                    className="transition-colors duration-200 underline-offset-4 hover:text-white hover:underline"
                >
                    Terms of Service
                </a>
                <a
                    href="#"
                    className="transition-colors duration-200 underline-offset-4 hover:text-white hover:underline"
                >
                    Privacy Policy
                </a>
                <a
                    href="#"
                    className="transition-colors duration-200 underline-offset-4 hover:text-white hover:underline"
                >
                    Contact Support
                </a>
            </div>
            <p className="text-muted-foreground/70">© 2026 Archivum. All rights reserved.</p>
        </div>
    );
};

const AuthForm: React.FC<AuthFormProps> = ({ providers, onSignIn, className }) => (
    <div className={cn("mx-auto flex w-full max-w-md flex-col gap-6 px-6", className)}>
        <div className="mb-6 flex flex-col space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold">Welcome to</h1>
                <h1 className="text-2xl font-bold text-brand">Archivum</h1>
            </div>
            <p className="text-sm text-muted-foreground">Sign in to access your account</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
            {providers.map((provider) => (
                <Button
                    key={provider}
                    variant="outline"
                    className="h-10 w-full max-w-72 rounded-md border border-white/70 bg-transparent text-sm font-medium hover:border-white hover:bg-accent"
                    onClick={() => {
                        onSignIn?.(provider);
                    }}
                >
                    <span className="text-brand">G</span>
                    <span>Continue with {formatProvider(provider)}</span>
                </Button>
            ))}
        </div>
    </div>
);

const AuthVisual = () => (
    <div className="relative hidden h-full overflow-hidden rounded-xl shadow-lg lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#282826_0%,#34515a_46%,#ff80bf_100%)]" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-0 flex items-end justify-center text-white">
            <div className="relative h-[min(132%,82rem)] w-[min(96%,62rem)]">
                <div className="font-['Cinzel_Decorative'] absolute left-1/2 top-[16%] z-20 -translate-x-[60%] text-[clamp(6rem,11vw,11.75rem)] font-bold leading-none tracking-[0.08em]">
                    ARCHI
                </div>
                <img
                    src="/arcei.png"
                    alt="Classical sculpture"
                    className="absolute bottom-0 left-1/2 z-30 h-full -translate-x-1/2 object-contain grayscale"
                />
                <div className="font-['Cinzel_Decorative'] absolute left-1/2 top-[36%] z-40 -translate-x-[2%] text-[clamp(6rem,11vw,11.75rem)] font-bold leading-none tracking-[0.08em]">
                    VUM
                </div>
            </div>
        </div>
    </div>
);

const Auth: React.FC<AuthProps> = ({ providers, onSignIn }) => {
    return (
        <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(26rem,1fr)_minmax(32rem,1fr)] lg:p-6">
            <div className="flex min-h-screen flex-col lg:min-h-0">
                <div className="flex flex-1 items-center justify-center">
                    <AuthForm providers={providers} onSignIn={onSignIn} />
                </div>
                <footer className="px-4">
                    <AuthFooter />
                </footer>
            </div>
            <AuthVisual />
        </div>
    );
}

export { Auth };
