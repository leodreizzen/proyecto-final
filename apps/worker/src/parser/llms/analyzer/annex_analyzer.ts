import {annexAnalyzerSystemPrompt} from "@/parser/llms/prompts/analyzer";
import {AnnexAnalysisResult, AnnexAnalysisResultSchema} from "@/parser/schemas/analyzer/annexes/result";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {AnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {ResolutionID} from "@/parser/schemas/common";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {validateAnnexAnalysis} from "@/parser/llms/analyzer/analysis_validations";
import {LLMRefusalError, LLMResponseValidationError} from "@/parser/llms/errors";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {ResultWithData} from "@/definitions";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {ParseResolutionError} from "@/parser/types";
import {retryCacheBuster, withLlmRetry} from "@/util/llm/retries";

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

export type ParseAnnexResult = ResultWithData<AnnexAnalysis, ParseResolutionError>

function isParseResultValid(res: AnnexAnalysisResult): res is ParseAnnexResult & AnnexAnalysisResult {
    if (res.success) return true;
    return res.error.code !== "other_error";
}

export async function analyzeAnnex(input: AnalyzeAnnexInput, firstAttempt: boolean): Promise<ParseAnnexResult> {
    return withLlmRetry((ctx) => _analyzeAnnex(input, firstAttempt && ctx.attempt === 1));
}

export async function _analyzeAnnex(input: AnalyzeAnnexInput, firstAttempt: boolean): Promise<ParseAnnexResult> {
    console.log("calling anenex analyzer model...");
    const annexJSON = JSON.stringify(input, null, 2);
    const LLMResult = await structuredLLMCall({
        model: "gemini-3-flash-preview",
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
                    text: retryCacheBuster(firstAttempt) + annexJSON
                }]
            }
        ]
    }, AnnexAnalysisResultSchema);

    if (!isParseResultValid(LLMResult)) {
        throw new LLMRefusalError(`Annex analyzer LLM call failed: ${LLMResult.error.message}`);
    }

    if (LLMResult.success) {
        const validationRes = validateAnnexAnalysis(LLMResult.data, input.annex);
        if (!validationRes.success) {
            console.error(JSON.stringify(validationRes, null, 2));
            throw new LLMResponseValidationError(`Annex analysis validation failed: ${validationRes.error}`);
        }
    }
    return LLMResult;
}