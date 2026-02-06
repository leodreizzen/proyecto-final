import {ExponentialBackoff, handleType, IRetryContext, wrap} from 'cockatiel';
import {InvalidLLMResponseError, LLMAPIError, LLMConsistencyValidationError} from "@/parser/llms/errors";
import {retry} from "cockatiel";
import {EmbeddingsAPIError} from "@/maintenance_tasks/embeddings/helpers/error";

const apiPolicy = retry(handleType(LLMAPIError), {
    maxAttempts: 2,
    backoff: new ExponentialBackoff({
        initialDelay: 1000,
        maxDelay: 10000,
        exponent: 2
    })
}); // TODO special treatment for rate limit?

const embeddingApiPolicy = retry(handleType(EmbeddingsAPIError), {
    maxAttempts: 4,
    backoff: new ExponentialBackoff({
        initialDelay: 500,
        maxDelay: 10000,
        exponent: 2
    })
});

const validationPolicy = retry(handleType(InvalidLLMResponseError), {
    maxAttempts: 2
});

const combinedPolicy = wrap(apiPolicy, validationPolicy);

export async function withLlmRetry<T>(operation: (context: IRetryContext) => Promise<T>): Promise<T> {
    try{
        return combinedPolicy.execute(operation);
    }
    catch (e){
        console.error("Error occurred while executing LLM operation:", e);
        throw e;
    }
}

export async function withEmbeddingsRetry<T>(operation: (context: IRetryContext) => Promise<T>): Promise<T> {
    try{
        return embeddingApiPolicy.execute(operation);
    }
    catch (e){
        console.error("Error occurred while executing embedding operation:", e);
        throw e;
    }
}


const consistencyPolicy = retry(handleType(LLMConsistencyValidationError), {
    maxAttempts: 2
});

export async function withLlmConsistencyRetry<T>(operation: (context: IRetryContext) => Promise<T>): Promise<T> {
    return consistencyPolicy.execute(operation);
}

export function retryCacheBuster(firstAttempt: boolean){
    if (!firstAttempt){
        return "String a ignorar: " + Math.random().toString(36).substring(2, 15) + "\n\n";
    } else
        return "";
}