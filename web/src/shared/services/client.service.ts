import { QueryClient } from "@tanstack/react-query";

export const STALE_TIME = {
    INSTANT: 0,
    SHORT: 30_000,
    MEDIUM: 300_000,
    LONG: 1_800_000,
    STATIC: 86_400_000,
} as const;

export const client = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: STALE_TIME.MEDIUM,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});
