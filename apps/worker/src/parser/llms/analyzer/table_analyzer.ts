import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {MultipleTableAnalysis, MultipleTableAnalysisSchema} from "@/parser/schemas/analyzer/tables/table";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {tableAnalyzerSystemPrompt} from "@/parser/llms/prompts/table_analyzer";
import {validateTableAnalysis} from "@/parser/llms/analyzer/analysis_validations";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMResponseValidationError} from "@/parser/llms/errors";
import {retryCacheBuster, withLlmRetry} from "@/util/llm/retries";

const schemaDescription = zodToLLMDescription(MultipleTableAnalysisSchema);

export async function analyze_tables(tables: TableStructure[], firstAttempt: boolean): Promise<MultipleTableAnalysis["result"]> {
    return withLlmRetry((ctx) => _analyze_tables(tables, firstAttempt && ctx.attempt === 1));
}

export async function _analyze_tables(tables: TableStructure[], firstAttempt: boolean): Promise<MultipleTableAnalysis["result"]> {
    if (tables.length === 0) {
        return [];
    }
    console.log("calling table analyzer model...");
    const LLMResult = await structuredLLMCall({
            model: "gemini-2.5-flash-lite",
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
                            text: tableAnalyzerSystemPrompt + schemaDescription,
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
                        text: retryCacheBuster(firstAttempt) + JSON.stringify(tables)
                    }]
                }
            ]
    }, MultipleTableAnalysisSchema);

    const validationRes = validateTableAnalysis(LLMResult.result, tables);
    if (!validationRes.success) {
        console.error(JSON.stringify(validationRes, null, 2));
        throw new LLMResponseValidationError(`Table analysis validation failed: ${validationRes.error}`);
    }

    return LLMResult.result;
}
