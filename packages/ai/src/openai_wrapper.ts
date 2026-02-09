import OpenAI from "openai";
import {
    ChatCompletion,
    ChatCompletionChunk,
} from "openai/resources";
import {Stream} from "openai/streaming";
import {EmbeddingCreateParams} from "openai/resources/embeddings";

declare module "openai/resources" {
    interface ChatCompletionContentPartText {
        cache_control?: {
            type: "ephemeral" | "persistent";
        };
    }
}

export type CreateOpenAICompletionInput = Parameters<OpenAI["chat"]["completions"]["create"]>[0] & {
    model: `gemini-${string}`
}

export type CreateOpenAIEmbeddingInput = EmbeddingCreateParams & {
    model: `gemini-${string}` | `text-embedding-${string}`
}

function isGemini(name: string): name is `gemini-${string}` {
    return name.startsWith("gemini-");
}

function isOpenai(name: string): name is `text-embedding-${string}` {
    return name.startsWith("text-embedding-");
}

const useOpenRouter = process.env.USE_OPENROUTER?.toLowerCase() === "true";

let openAIInstances: Record<"gemini" | "openai", OpenAI>;
if (useOpenRouter) {
    const client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1/",
    })
    openAIInstances = {
        gemini: client,
        openai: client,
    }
} else {
    openAIInstances = {
        gemini: new OpenAI({
            apiKey: process.env.GOOGLE_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        }),
        openai: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        }),
    }
}


export async function createOpenAICompletion(
    params: Omit<CreateOpenAICompletionInput, "stream"> & { stream: true }
): Promise<Stream<ChatCompletionChunk>>;
export async function createOpenAICompletion(
    params: Omit<CreateOpenAICompletionInput, "stream"> & { stream?: false | null }
): Promise<ChatCompletion>;

export async function createOpenAICompletion<P extends CreateOpenAICompletionInput>(params: P): Promise<Stream<ChatCompletionChunk> | ChatCompletion> {
    const modelName = params.model;
    const {model: finalModelName, client} = getClientConfig(modelName);

    return client.chat.completions.create({
        ...params,
        model: finalModelName,
    });
}

export async function createOpenaiEmbedding(
    params: CreateOpenAIEmbeddingInput
) {
    const modelName = params.model;
    const {model: finalModelName, client} = getClientConfig(modelName);

    return client.embeddings.create({
        ...params,
        model: finalModelName,
    });
}

function getClientConfig(modelName: CreateOpenAIEmbeddingInput["model"]): { model: string, client: OpenAI } {
    let client: OpenAI;
    let model;
    if (isGemini(modelName)) {
        client = openAIInstances.gemini;
        if (useOpenRouter)
            model = `google/${modelName}`;
        else
            model = modelName;
    } else if (isOpenai(modelName)) {
        client = openAIInstances.openai;
        if (useOpenRouter)
            model = `openai/${modelName}`;
        else
            model = modelName;
    } else {
        const _exhaustiveCheck: never = modelName;
        throw new Error("Model not supported yet in this app: " + modelName);
    }


    return {model: model, client};
}


export {APIError} from "openai";
export type {ChatCompletion} from "openai/resources"