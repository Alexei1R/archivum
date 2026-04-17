import axios, { AxiosError } from "axios";
import type { HttpError } from "../types";
import { env } from "@/shared/constants";
import { toast } from "sonner";

declare module "axios" {
    interface InternalAxiosRequestConfig {
        metadata?: { startTime: number };
    }
}

const api = axios.create({
    baseURL: env.API_URL,
    timeout: env.API_TIMEOUT || 1000000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json , text/event-stream",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<HttpError>) => {
        if (error.code === "ECONNABORTED" || !error.response) {
            toast.error("Network connection failed");
            return Promise.reject(new Error("Network connection failed"));
        }
        return Promise.reject(error);
    },
);

export { api };
