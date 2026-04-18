type NodeEnv = "development" | "production";

interface Environment {
    readonly API_URL: string;
    readonly API_TIMEOUT?: number;
    readonly NODE_ENV: NodeEnv;
    readonly APPLICATION_NAME?: string;
    readonly MAPTILER_KEY?: string;
    readonly EVENTBRITE_TOKEN?: string;
    readonly TICKETMASTER_API_KEY?: string;
    readonly SERPAPI_KEY?: string;
}

const createEnv = (): Environment => {
    const nodeEnv = (import.meta.env.VITE_NODE_ENV as NodeEnv) || "development";
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const apiTimeout = import.meta.env.VITE_API_TIMEOUT
        ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10)
        : undefined;
    const applicationName = import.meta.env.VITE_APPLICATION_NAME || "Fuse";
    const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
    const eventbriteToken = import.meta.env.VITE_EVENTBRITE_TOKEN;
    const ticketmasterApiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;
    const serpApiKey = import.meta.env.VITE_SERPAPI_KEY;

    return {
        API_URL: apiUrl,
        NODE_ENV: nodeEnv,
        API_TIMEOUT: apiTimeout,
        APPLICATION_NAME: applicationName,
        MAPTILER_KEY: maptilerKey,
        EVENTBRITE_TOKEN: eventbriteToken,
        TICKETMASTER_API_KEY: ticketmasterApiKey,
        SERPAPI_KEY: serpApiKey,
    } as const;
};

export const env = createEnv();
