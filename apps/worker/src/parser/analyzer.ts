import {ResolutionStructure} from "@/parser/schemas/parser/schemas";
import {zodToLLMDescription} from "@/util/zod_to_llm";
import {analyzerSystemPrompt} from "@/parser/prompt";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import OpenAI from "openai";
import {parseLLMResponse} from "@/util/llm_response";
import {LLMError, ResultWithData} from "@/definitions";
import {ResolutionAnalysisResultSchema} from "@/parser/schemas/analyzer/result";
import {countTokens} from "@/util/tokenCounter";

const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const schemaDescription = zodToLLMDescription(ResolutionAnalysisResultSchema);

export async function analyzeResolution(resolution: ResolutionStructure): Promise<ResultWithData<ResolutionAnalysis, LLMError>> {
    console.log("calling analyzer model...");
    const resolutionJSON = JSON.stringify(resolution, null, 2);
    let res
    try {
        res = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            response_format: {
                type: "json_object"
            },
            reasoning_effort: "medium",
            max_completion_tokens: 64000,
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
                        text: resolutionJSON
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
    const jsonParseRes = parseLLMResponse(res, ResolutionAnalysisResultSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
        if (LLMResult.processSuccess) {
        return {
            success: true,
            data: LLMResult.data
        }
    }
        else {
        return {
            success: false,
            error: { code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        };
    }}