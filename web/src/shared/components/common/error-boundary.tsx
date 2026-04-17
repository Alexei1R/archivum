import { useRouteError } from "react-router-dom";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

export const ErrorBoundary = () => {
    const error = useRouteError();

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        if (error && typeof error === "object" && "message" in error) {
            return String(error.message);
        }
        return "An unknown error occurred";
    };

    const getErrorDetails = (error: unknown): string => {
        if (error instanceof Error) {
            return error.stack || error.toString();
        }
        return JSON.stringify(error, null, 2);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto text-center space-y-6 p-8 rounded-lg">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />

                <div className="space-y-2">
                    <h2 className="text-4xl font-semibold text-gray-900 dark:text-white">
                        Something went wrong
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        {getErrorMessage(error) || "An unexpected error occurred"}
                    </p>
                </div>
                <div className="mt-3 p-4 rounded-md  border">
                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 overflow-auto max-h-64 text-left whitespace-pre-wrap break-words">
                        {getErrorDetails(error)}
                    </pre>
                </div>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-6"
                >
                    Reload Page
                </Button>
            </div>
        </div>
    );
};
