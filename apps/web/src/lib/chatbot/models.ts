import {createOpenRouter, LanguageModelV3} from "@openrouter/ai-sdk-provider";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {ProviderV3} from "@ai-sdk/provider";

export let model: LanguageModelV3;
const useOpenrouter = process.env.USE_OPENROUTER?.toLowerCase() === 'true'

let openrouterProvider: ProviderV3 | null = null;
if (useOpenrouter) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }
    openrouterProvider = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });
}
let geminiProvider: ProviderV3 | null = null;
if (!useOpenrouter) {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is not set in environment variables.');
    }
    geminiProvider = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
    })
}

export function getChatbotModel(){
    if (useOpenrouter) {
        if (!openrouterProvider) {
            throw new Error("OpenRouter provider is not initialized.");
        }
        return openrouterProvider.languageModel("google/gemini-3-flash-preview");
    } else {
        if (!geminiProvider) {
            throw new Error("Google Gemini provider is not initialized.");
        }
        return geminiProvider.languageModel("gemini-3-flash-preview");
    }
}

let noModelLogged = false;
export function getModerationModel() {
    if (useOpenrouter) {
        if (!openrouterProvider) {
            throw new Error("OpenRouter provider is not initialized.");
        }
        return openrouterProvider.languageModel("openai/gpt-oss-safeguard-20b");
    }
    else {
        if (!noModelLogged) {
            console.warn("No moderation model is configured without openrouter. Moderation will be skipped.");
            noModelLogged = true;
        }
        return null;
    }
}