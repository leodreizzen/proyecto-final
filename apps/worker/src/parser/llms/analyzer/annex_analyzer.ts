import {LLMError, ResultWithData} from "@/definitions";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {createOpenAICompletion} from "@/util/llm/openai_wrapper";
import {annexAnalyzerSystemPrompt} from "@/parser/llms/prompts/analyzer";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {AnnexAnalysisResultSchema} from "@/parser/schemas/analyzer/annexes/result";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {AnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {ResolutionID} from "@/parser/schemas/common";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";

const annexSchemaDescription = zodToLLMDescription(AnnexAnalysisResultSchema);
type AnalyzeAnnexInput = {
    annex: AnnexStructure,
    annexNumber: number,
    resolutionArticles: ResolutionStructure["articles"],
    recitals: ResolutionStructure["recitals"],
    considerations: ResolutionStructure["considerations"],
    resolutionId: ResolutionID,
    metadata: MainResolutionAnalysis["metadata"]
}

export async function analyzeAnnex(input: AnalyzeAnnexInput): Promise<ResultWithData<AnnexAnalysis, LLMError>> {
    console.log("calling anenex analyzer model...");
    const annexJSON = JSON.stringify(input, null, 2);
    let res
    try {
        res = await createOpenAICompletion({
            model: "gemini-2.5-flash",
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
                            text: annexAnalyzerSystemPrompt + annexSchemaDescription,
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
                        text: annexJSON
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
    const jsonParseRes = parseLLMResponse(res, AnnexAnalysisResultSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
    if (LLMResult.success) {
        return {
            success: true,
            data: LLMResult.data
        }
    } else {
        return {
            success: false,
            error: {code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        };
    }
}