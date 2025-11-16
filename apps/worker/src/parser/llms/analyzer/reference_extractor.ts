import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {LLMError, ResultWithData} from "@/definitions";
import {createOpenAICompletion} from "@/util/llm/openai_wrapper";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionReferencesAnalysis, ResolutionReferencesSchema} from "@/parser/schemas/references/schemas";
import {referenceExtractorSystemPrompt} from "@/parser/llms/prompts/reference_extractor";
import {validateReferences} from "@/parser/llms/analyzer/analysis_validations";

const schemaDescription = zodToLLMDescription(ResolutionReferencesSchema);

export async function extractReferences(resolution: ResolutionStructure): Promise<ResultWithData<ResolutionReferencesAnalysis, LLMError>> {
    // TODO ALLOW REFUSAL
    console.log("calling reference extractor model...");
    let res;
    try {
        res = await createOpenAICompletion({
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
        });
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: {code: "api_error"}
        };
    }
    const jsonParseRes = parseLLMResponse(res, ResolutionReferencesSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;

    const validationRes = validateReferences(LLMResult, resolution);
    if (!validationRes.success) {
        console.error(JSON.stringify(validationRes, null, 2));
        return {
            success: false,
            error: {code: "validation_error"}
        }
    }

    return {
        success: true,
        data: LLMResult
    }
}
