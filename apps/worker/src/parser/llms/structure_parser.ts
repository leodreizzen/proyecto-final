import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionStructureLLMResult, ResolutionStructureResultSchema} from "@/parser/schemas/structure_parser/result";
import {structureParserSystemPrompt} from "@/parser/llms/prompts/structure_parser";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMRefusalError, LLMResponseValidationError} from "@/parser/llms/errors";
import {retryCacheBuster, withLlmRetry} from "@/util/llm/retries";
import {validateStructureTableReferences} from "@/parser/llms/validation/table_validator";

const schemaDescription = zodToLLMDescription(ResolutionStructureResultSchema);

export type ParseResolutionStructureResult =
    | Extract<ResolutionStructureLLMResult, { success: true }>
    | {
    success: false;
    error: {
        code: Exclude<Extract<ResolutionStructureLLMResult, { success: false }>['error']['code'], "other_error">;
        message: string;
    }
};

function isParseResultValid(res: ResolutionStructureLLMResult): res is ParseResolutionStructureResult {
    if (res.success) return true;
    return res.error.code !== "other_error";
}

export async function parseResolutionStructure(fileContent: string, firstAttempt: boolean): Promise<ParseResolutionStructureResult> {
    return withLlmRetry((ctx) => _parseResolutionStructure(fileContent, firstAttempt && ctx.attempt === 1));
}

async function _parseResolutionStructure(fileContent: string, firstAttempt: boolean): Promise<ParseResolutionStructureResult> {
    console.log("calling structure parser model...");
    const res = await structuredLLMCall({
            model: "gemini-2.5-flash-lite",
            response_format: {
                type: "json_object"
            },
            reasoning_effort: "high",
            max_completion_tokens: 30000,
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
                        text: retryCacheBuster(firstAttempt) + fileContent
                    }]
                }
            ]
        }, ResolutionStructureResultSchema);

    if (!isParseResultValid(res)) {
        throw new LLMRefusalError(`Structure parser LLM call failed: ${res.error.message}`);
    }

    if (res.success) {
        const tableErrors = validateStructureTableReferences(res.data);
        if (tableErrors.length > 0) {
            throw new LLMResponseValidationError(`Inconsistent table references in structure: ${tableErrors.join(", ")}`);
        }
    }

    return res;
}
