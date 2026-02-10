import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionReferencesAnalysis, ResolutionReferencesSchema} from "@/parser/schemas/references/schemas";
import {itemsCountPrompt, referenceExtractorSystemPrompt} from "@/parser/llms/prompts/reference_extractor";
import {validateReferences} from "@/parser/llms/analyzer/analysis_validations";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMResponseValidationError} from "@/parser/llms/errors";
import {retryCacheBuster, withLlmRetry} from "@/util/llm/retries";

const schemaDescription = zodToLLMDescription(ResolutionReferencesSchema);

export async function extractReferences(resolution: ResolutionStructure, firstAttempt: boolean): Promise<ResolutionReferencesAnalysis> {
    return withLlmRetry((ctx) => _extractReferences(resolution, firstAttempt && ctx.attempt === 1));
}

export async function _extractReferences(resolution: ResolutionStructure, firstAttempt: boolean): Promise<ResolutionReferencesAnalysis> {
    // TODO ALLOW REFUSAL
    console.log("calling reference extractor model...");
    const LLMResult = await structuredLLMCall({
        model: "gemini-3-flash-preview",
        response_format: {
            type: "json_object"
        },
        reasoning_effort: "medium",
        max_completion_tokens: 40000,
        messages: [
            {
                role: "developer",
                content: [
                    {
                        type: "text",
                        text: referenceExtractorSystemPrompt + schemaDescription,
                        cache_control: {
                            type: "ephemeral"
                        }
                    }, {
                        type: "text",
                        text: itemsCountPrompt(resolution)
                    }
                ],
            },
            {
                role: "user",
                content: [{
                    type: "text",
                    text: retryCacheBuster(firstAttempt) + "\n\n" + JSON.stringify(resolution)
                }]
            }
        ]
    }, ResolutionReferencesSchema);

    const validationRes = validateReferences(LLMResult, resolution);
    if (!validationRes.success) {
        console.error(JSON.stringify(validationRes, null, 2));
        throw new LLMResponseValidationError(`Reference extraction validation failed: ${validationRes.error}`);
    }

    return LLMResult;
}
