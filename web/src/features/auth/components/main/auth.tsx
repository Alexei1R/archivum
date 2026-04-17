import { Button } from "@/shared/components";
import { cn } from "@/shared/utils";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import type React from "react";
import { useState } from "react";
import { z } from "zod";

interface AuthProps {
    providers: string[];
    onSignIn?: (provider: string) => void;
}

const formatProvider = (provider: string) =>
    provider.charAt(0).toUpperCase() + provider.slice(1);

interface AuthFormProps extends AuthProps {
    className?: string;
}

const loginSchema = z.object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type LoginErrors = Partial<Record<keyof LoginValues, string>>;

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

const AuthForm: React.FC<AuthFormProps> = ({ providers, onSignIn, className }) => {
    const [values, setValues] = useState<LoginValues>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<LoginErrors>({});

    const updateField = (field: keyof LoginValues, value: string) => {
        setValues(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handlePasswordLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const result = loginSchema.safeParse(values);
        if (!result.success) {
            const nextErrors: LoginErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof LoginValues | undefined;
                if (field) nextErrors[field] = issue.message;
            }
            setErrors(nextErrors);
            return;
        }

        toast.info("Email and password login is not implemented yet");
    };

    return (
        <div className={cn("mx-auto flex w-full max-w-md flex-col gap-6 px-6", className)}>
            <div className="mb-2 flex flex-col space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">Welcome to</h1>
                    <h1 className="text-2xl font-bold text-brand">Archivum</h1>
                </div>
                <p className="text-sm text-muted-foreground">Sign in to access your account</p>
            </div>

            <form className="mx-auto w-full max-w-72 space-y-4" onSubmit={handlePasswordLogin} noValidate>
                <div className="space-y-2">
                    <div
                        className={cn(
                            "flex h-10 w-full items-center gap-2 rounded-md border bg-background px-3 transition-colors focus-within:border-brand",
                            errors.email ? "border-destructive" : "border-white/40"
                        )}
                    >
                        <Mail className="size-4 text-brand" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="you@example.com"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div
                        className={cn(
                            "flex h-10 w-full items-center gap-2 rounded-md border bg-background px-3 transition-colors focus-within:border-brand",
                            errors.password ? "border-destructive" : "border-white/40"
                        )}
                    >
                        <KeyRound className="size-4 text-brand" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={values.password}
                            onChange={(event) => updateField("password", event.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Enter your password"
                        />
                    </div>
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                <Button type="submit" className="h-10 w-full rounded-md text-sm font-medium">
                    Log in
                </Button>
            </form>

            <div className="mx-auto flex w-full max-w-72 items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
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
};

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
