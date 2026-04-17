const AUTH_APP_NAME = "Archivum";
const AUTH_COPYRIGHT_YEAR = 2026;

const AUTH_FOOTER_LINKS = [
    "Terms of Service",
    "Privacy Policy",
    "Contact Support",
] as const;

const AUTH_MESSAGES = {
    subtitle: "Sign in to access your account",
    passwordLoginUnavailable: "Email and password login is not implemented yet. Please continue with Google.",
} as const;

const AUTH_ASSETS = {
    sculpture: "/arcei.png",
} as const;

const AUTH_PROVIDER_MARKS: Record<string, string> = {
    google: "G",
} as const;

const AUTH_CLASSES = {
    formWidth: "w-full max-w-80 lg:max-w-72",
    fieldShell:
        "flex h-11 w-full items-center gap-2 rounded-md border bg-background px-3 transition-colors focus-within:border-brand lg:h-10",
    fieldInput:
        "h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
    desktopGradient:
        "bg-[linear-gradient(180deg,#282826_0%,#34515a_46%,#ff80bf_100%)]",
    mobileGradient:
        "bg-[linear-gradient(180deg,#282826_0%,#34515a_50%,#ff80bf_100%)]",
    visualFont:
        "font-['Cinzel_Decorative'] font-bold leading-none tracking-[0.08em]",
} as const;

export {
    AUTH_APP_NAME,
    AUTH_ASSETS,
    AUTH_CLASSES,
    AUTH_COPYRIGHT_YEAR,
    AUTH_FOOTER_LINKS,
    AUTH_MESSAGES,
    AUTH_PROVIDER_MARKS,
};
