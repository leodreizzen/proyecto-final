import {ZodError} from "zod";
import {APIError} from "openai";

export class InvalidLLMResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidLLMResponseError';

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
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}

export class LLMRefusalError extends LLMResponseValidationError {
    constructor(message: string) {
        super(message);
        this.name = 'LLMRefusalError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}

export class LLMConsistencyValidationError extends InvalidLLMResponseError {
    constructor(message: string) {
        super(message);
        this.name = 'LLMConsistencyValidationError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidLLMResponseError);
        }
    }
}
