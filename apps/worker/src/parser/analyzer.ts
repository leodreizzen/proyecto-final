import {ResolutionStructure} from "@/parser/schemas/parser/schemas";
import {zodToLLMDescription} from "@/util/zod_to_llm";
import {analyzerSystemPrompt} from "@/parser/prompt";
import {ResolutionAnalysis, ResolutionAnalysisSchema} from "@/parser/schemas/analyzer/resolution";
import OpenAI from "openai";
import {parseLLMResponse} from "@/util/llm_response";
import {LLMError, ResultWithData} from "@/definitions";

const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const schemaDescription = zodToLLMDescription(ResolutionAnalysisSchema);

export async function analyzeResolution(resolution: ResolutionStructure): Promise<ResultWithData<ResolutionAnalysis, LLMError>> {
    console.log("calling analyzer model...");
    let res
    try {
        res = await openai.chat.completions.create({
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
        })
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: {code: "api_error"}
        };
    }
    return parseLLMResponse(res, ResolutionAnalysisSchema);
}