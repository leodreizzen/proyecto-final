import {LLMError, ResultWithData} from "@/definitions";
import {createOpenAICompletion} from "@/util/llm/openai_wrapper";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {MultipleTableAnalysis, MultipleTableAnalysisSchema} from "@/parser/schemas/analyzer/tables/table";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {tableAnalyzerSystemPrompt} from "@/parser/llms/prompts/table_analyzer";

const schemaDescription = zodToLLMDescription(MultipleTableAnalysisSchema);

export async function tableAnalyzer(tables: TableStructure[]): Promise<ResultWithData<MultipleTableAnalysis, LLMError>> {
    console.log("calling table analyzer model...");
    let res;
    try {
        res = await createOpenAICompletion({
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
                        text: JSON.stringify(tables)
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
    const jsonParseRes = parseLLMResponse(res, MultipleTableAnalysisSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
    return {
        success: true,
        data: LLMResult
    }
}
