import { AxiosError } from "axios";

interface ErrorResponse {
    message?: string;
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
        const message = (error.response?.data as ErrorResponse | undefined)?.message;
        if (message) {
            return message;
        }

        if (!error.response) {
            return "Unable to reach the server. Please try again.";
        }
    }

    return fallback;
}
