import {
    AUTH_APP_NAME,
    AUTH_COPYRIGHT_YEAR,
    AUTH_FOOTER_LINKS,
} from "@/features/auth/constants";

const AuthFooter = () => {
    return (
        <div className="py-6 text-center text-xs text-muted-foreground">
            <div className="mb-3 flex justify-center space-x-6">
                {AUTH_FOOTER_LINKS.map((label) => (
                    <a
                        key={label}
                        href="#"
                        className="transition-colors duration-200 underline-offset-4 hover:text-white hover:underline"
                    >
                        {label}
                    </a>
                ))}
            </div>
            <p className="text-muted-foreground/70">
                © {AUTH_COPYRIGHT_YEAR} {AUTH_APP_NAME}. All rights reserved.
            </p>
        </div>
    );
};

export { AuthFooter };
