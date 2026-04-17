type NodeEnv = "development" | "production";

interface Environment {
    readonly API_URL: string;
    readonly API_TIMEOUT?: number;
    readonly NODE_ENV: NodeEnv;
    readonly APPLICATION_NAME?: string;
}

const createEnv = (): Environment => {
    const nodeEnv = (import.meta.env.VITE_NODE_ENV as NodeEnv) || "development";
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const apiTimeout = import.meta.env.VITE_API_TIMEOUT
        ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10)
        : undefined;
    const applicationName = import.meta.env.VITE_APPLICATION_NAME || "Fuse";

    return {
        API_URL: apiUrl,
        NODE_ENV: nodeEnv,
        API_TIMEOUT: apiTimeout,
        APPLICATION_NAME: applicationName,
    } as const;
};

export const env = createEnv();
