import {APIError} from "@repo/ai/openai_wrapper";

export class EmbeddingsAPIError extends Error {
    public details: APIError | Error | null;

    constructor(message: string, details: APIError | Error | null) {
        super(message);
        this.name = 'EmbeddingsAPIError';
        this.details = details;
        Object.setPrototypeOf(this, EmbeddingsAPIError.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, EmbeddingsAPIError);
        }
    }
}
