import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionStructureLLMResult, ResolutionStructureResultSchema} from "@/parser/schemas/structure_parser/result";
import {structureParserSystemPrompt} from "@/parser/llms/prompts/structure_parser";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMRefusalError} from "@/parser/llms/errors";
import {withLlmRetry} from "@/util/llm/retries";

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

export async function parseResolutionStructure(fileContent: string): Promise<ParseResolutionStructureResult> {
    return withLlmRetry(() => _parseResolutionStructure(fileContent));
}

async function _parseResolutionStructure(fileContent: string): Promise<ParseResolutionStructureResult> {
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
                        text: fileContent
                    }]
                }
            ]
        }, ResolutionStructureResultSchema);

    if (!isParseResultValid(res)) {
        throw new LLMRefusalError(`Structure parser LLM call failed: ${res.error.message}`);
    }
    return res;
}
