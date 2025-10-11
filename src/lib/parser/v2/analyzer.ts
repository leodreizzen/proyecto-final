import {ResolutionStructure, ResolutionStructureSchema} from "@/lib/parser/v2/parser_schemas";
import {zodToLLMDescription} from "@/lib/parser/util/zod_to_llm";
import {analyzerSystemPrompt} from "@/lib/parser/v2/prompt";
import {ResolutionAnalysisSchema} from "@/lib/parser/v2/analyzer_schemas";
import OpenAI from "openai";
import "openai/resources";
const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

declare module "openai/resources"{
    interface ChatCompletionContentPartText {
        cache_control?: {
            type: "ephemeral" | "persistent"
        }
    }
}


export async function analyzeResolution(resolution: ResolutionStructure){
    const schemaDescription = zodToLLMDescription(ResolutionAnalysisSchema);
    console.log("calling analyzer model...");
    const res = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        response_format: {
            type: "json_object"
        },
        reasoning_effort: "low",
        max_completion_tokens: 18000,
        messages: [
            {
                role: "developer",
                content: [
                    {
                        type: "text",
                        text: analyzerSystemPrompt + schemaDescription,
                        cache_control: {
                            type: "ephemeral"
                        }
                    }
                ],
            },
            {
                role: "user",
                content: [{
                    type: "text",
                    text: JSON.stringify(resolution, null, 2)
                }]
            }
        ]
    });
    return res;
}