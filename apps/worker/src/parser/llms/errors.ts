import {ZodError} from "zod";
import {APIError} from "@repo/ai/openai_wrapper";

export class InvalidLLMResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidLLMResponseError';
        Object.setPrototypeOf(this, InvalidLLMResponseError.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}

export type LLMAPIErrorCode = "no_response" | "rate_limit" | "server_error" | "client_error";
export class LLMAPIError extends Error {
    public errorCode: LLMAPIErrorCode;
    public details: APIError | Error | null;

    constructor(message: string, llmCode: LLMAPIErrorCode, details: APIError | Error | null) {
        super(`[${llmCode}] ${message}`);
        this.name = 'LLMAPIError';
        this.errorCode = llmCode;
        this.details = details;
        Object.setPrototypeOf(this, LLMAPIError.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }

    }
}

export class LLMOutputParseError extends InvalidLLMResponseError {
    public errorDetails: ZodError;

    constructor(message: string, details: ZodError) {
        super(message);
        this.name = 'LLMOutputParseError';

        Object.setPrototypeOf(this, LLMOutputParseError.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LLMOutputParseError);
        }
        this.errorDetails = details;
    }
}

export class LLMResponseValidationError extends InvalidLLMResponseError {
    constructor(message: string) {
        super(message);
        this.name = 'LLMResponseValidationError';
        Object.setPrototypeOf(this, LLMResponseValidationError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}

export class LLMRefusalError extends LLMResponseValidationError {
    constructor(message: string) {
        super(message);
        this.name = 'LLMRefusalError';
        Object.setPrototypeOf(this, LLMRefusalError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}

export class LLMConsistencyValidationError extends InvalidLLMResponseError {
    constructor(message: string) {
        super(message);
        this.name = 'LLMConsistencyValidationError';
        Object.setPrototypeOf(this, LLMConsistencyValidationError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}
