import OpenAI from "openai";
import {
    ChatCompletion,
    ChatCompletionChunk,
} from "openai/resources";
import {Stream} from "openai/streaming";
import {EmbeddingCreateParams} from "openai/resources/embeddings";

export type CreateOpenAICompletionInput = Parameters<OpenAI["chat"]["completions"]["create"]>[0] &  {
    model: `gemini-${string}`
}

export type GeminiTaskType =
    | "RETRIEVAL_QUERY"
    | "RETRIEVAL_DOCUMENT"
    | "SEMANTIC_SIMILARITY"
    | "CLASSIFICATION"
    | "CODE_RETRIEVAL_QUERY"
    | "QUESTION_ANSWERING"
    | "FACT_VERIFICATION"
    | "CLUSTERING";

export type CreateOpenAIEmbeddingInput = EmbeddingCreateParams & {
    model: `gemini-${string}`
} & {
    taskType?: GeminiTaskType
}

function isGemini(name: string): name is `gemini-${string}` {
    return name.startsWith("gemini-");
}
const useOpenRouter = process.env.USE_OPENROUTER?.toLowerCase() === "true";

let openAIInstance: OpenAI;
if(useOpenRouter){
    openAIInstance = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1/",
    })
} else{
    openAIInstance = new OpenAI({
        apiKey: process.env.GOOGLE_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    })
}

export async function createOpenAICompletion(
    params: Omit<CreateOpenAICompletionInput, "stream"> & { stream: true }
): Promise<Stream<ChatCompletionChunk>>;
export async function createOpenAICompletion(
    params: Omit<CreateOpenAICompletionInput, "stream"> & { stream?: false | null }
): Promise<ChatCompletion>;

export async function createOpenAICompletion<P extends CreateOpenAICompletionInput>(params: P): Promise<Stream<ChatCompletionChunk> | ChatCompletion> {
    const modelName = params.model;
    let finalModelName: string = params.model;
    if (useOpenRouter) {
        if (isGemini(modelName)) {
            finalModelName = `google/${modelName}`;
        } else {
            const _exhaustiveCheck: never = modelName;
            throw new Error("Model not supported yet with OpenRouter in this app: " + modelName);
        }
    }

    return openAIInstance.chat.completions.create({
        ...params,
        model: finalModelName,
    });
}

export async function createOpenaiEmbedding(
    params: CreateOpenAIEmbeddingInput
) {
    const modelName = params.model;
    let finalModelName: string = params.model;
    if (useOpenRouter) {
        if (isGemini(modelName)) {
            finalModelName = `google/${modelName}`;
        } else {
            const _exhaustiveCheck: never = modelName;
            throw new Error("Model not supported yet with OpenRouter in this app: " + modelName);
        }
    }

    return openAIInstance.embeddings.create({
        ...params,
        model: finalModelName,
    });
}