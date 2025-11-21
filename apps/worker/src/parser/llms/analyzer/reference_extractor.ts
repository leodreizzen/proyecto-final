import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionReferencesAnalysis, ResolutionReferencesSchema} from "@/parser/schemas/references/schemas";
import {referenceExtractorSystemPrompt} from "@/parser/llms/prompts/reference_extractor";
import {validateReferences} from "@/parser/llms/analyzer/analysis_validations";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMResponseValidationError} from "@/parser/llms/errors";
import {withLlmRetry} from "@/util/llm/retries";

const schemaDescription = zodToLLMDescription(ResolutionReferencesSchema);

export async function extractReferences(resolution: ResolutionStructure): Promise<ResolutionReferencesAnalysis> {
    return withLlmRetry(() => _extractReferences(resolution));
}

export async function _extractReferences(resolution: ResolutionStructure): Promise<ResolutionReferencesAnalysis> {
    // TODO ALLOW REFUSAL
    console.log("calling reference extractor model...");
    const LLMResult = await structuredLLMCall({
        model: "gemini-2.5-flash",
        response_format: {
            type: "json_object"
        },
        reasoning_effort: "medium",
        max_completion_tokens: 25000,
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
                    }
                ],
            },
            {
                role: "user",
                content: [{
                    type: "text",
                    text: JSON.stringify(resolution)
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
