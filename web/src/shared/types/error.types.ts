export interface HttpError {
    status: number;
    message: string;
    details?: string;
    error?: string;
    timestamp?: string;
}
