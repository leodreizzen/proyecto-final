import OpenAI from "openai";
import {ResolutionStructure, ResolutionStructureSchema} from "@/parser/schemas/parser/schemas";
import {structureParserSystemPrompt} from "@/parser/prompt";
import {LLMError, ResultWithData} from "@/definitions";
import {zodToLLMDescription} from "@/util/zod_to_llm";
import {parseLLMResponse} from "@/util/llm_response";

const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});


export async function parseResolutionStructure(fileContent: string): Promise<ResultWithData<ResolutionStructure, LLMError>> {
    console.log("calling structure parser model...");
    const schemaDescription = zodToLLMDescription(ResolutionStructureSchema); //TODO CACHE
    let res;
    try {
        res = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash-lite",
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
                            text: structureParserSystemPrompt + schemaDescription,
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
                        text: fileContent
                    }]
                }
            ]
        });
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: { code: "api_error" }
        };
    }
    return parseLLMResponse(res, ResolutionStructureSchema);
}
