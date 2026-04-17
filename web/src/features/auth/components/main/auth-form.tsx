import { Button } from "@/shared/components";
import { cn } from "@/shared/utils";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
    AUTH_APP_NAME,
    AUTH_CLASSES,
    AUTH_MESSAGES,
    AUTH_PROVIDER_MARKS,
} from "@/features/auth/constants";
import {
    getLoginErrors,
    initialLoginValues,
    loginSchema,
    type LoginErrors,
    type LoginValues,
} from "./auth.validation";

interface AuthFormProps {
    providers: string[];
    onSignIn?: (provider: string) => void;
    className?: string;
}

interface AuthFieldProps {
    id: keyof LoginValues;
    type: "email" | "password";
    autoComplete: string;
    placeholder: string;
    value: string;
    error?: string;
    onChange: (field: keyof LoginValues, value: string) => void;
}

const formatProvider = (provider: string) =>
    provider.charAt(0).toUpperCase() + provider.slice(1);

const getProviderMark = (provider: string) =>
    AUTH_PROVIDER_MARKS[provider.toLowerCase()] ?? provider.charAt(0).toUpperCase();

const AuthField = ({
    id,
    type,
    autoComplete,
    placeholder,
    value,
    error,
    onChange,
}: AuthFieldProps) => {
    return (
        <div className="space-y-2">
            <div
                className={cn(
                    AUTH_CLASSES.fieldShell,
                    error ? "border-destructive" : "border-white/40"
                )}
            >
                <input
                    id={id}
                    name={id}
                    type={type}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(event) => onChange(id, event.target.value)}
                    className={AUTH_CLASSES.fieldInput}
                    placeholder={placeholder}
                />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
};

const AuthForm = ({ providers, onSignIn, className }: AuthFormProps) => {
    const [values, setValues] = useState<LoginValues>(initialLoginValues);
    const [errors, setErrors] = useState<LoginErrors>({});

    const updateField = (field: keyof LoginValues, value: string) => {
        setValues(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handlePasswordLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const result = loginSchema.safeParse(values);
        if (!result.success) {
            setErrors(getLoginErrors(result.error.issues));
            return;
        }

        toast.info(AUTH_MESSAGES.passwordLoginUnavailable);
    };

    return (
        <div className={cn("mx-auto flex w-full max-w-md flex-col gap-6 px-6", className)}>
            <div className="mb-2 flex flex-col space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">Welcome to</h1>
                    <h1 className="text-2xl font-bold text-brand">{AUTH_APP_NAME}</h1>
                </div>
                <p className="text-sm text-muted-foreground">{AUTH_MESSAGES.subtitle}</p>
            </div>

            <form
                className={cn("mx-auto space-y-4", AUTH_CLASSES.formWidth)}
                onSubmit={handlePasswordLogin}
                noValidate
            >
                <AuthField
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    error={errors.email}
                    onChange={updateField}
                />

                <AuthField
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={values.password}
                    error={errors.password}
                    onChange={updateField}
                />

                <Button type="submit" className="h-11 w-full rounded-md text-sm font-medium lg:h-10">
                    Log in
                </Button>
            </form>

            <div className={cn("mx-auto flex items-center gap-3", AUTH_CLASSES.formWidth)}>
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
                {providers.map((provider) => (
                    <Button
                        key={provider}
                        variant="outline"
                        className={cn(
                            "h-11 rounded-md border border-white/70 bg-transparent text-sm font-medium hover:border-white hover:bg-accent lg:h-10",
                            AUTH_CLASSES.formWidth
                        )}
                        onClick={() => onSignIn?.(provider)}
                    >
                        <span className="text-brand">{getProviderMark(provider)}</span>
                        <span>Continue with {formatProvider(provider)}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export { AuthForm };
export type { AuthFormProps };
