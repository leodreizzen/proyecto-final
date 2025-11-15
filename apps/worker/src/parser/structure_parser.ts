import {
    ResolutionStructure,

} from "@/parser/schemas/structure_parser/schemas";
import {structureParserSystemPrompt} from "@/parser/prompt";
import {LLMError, ResultWithData} from "@/definitions";
import {zodToLLMDescription} from "@/util/zod_to_llm";
import {parseLLMResponse} from "@/util/llm_response";
import {createOpenAICompletion} from "@/util/openai_wrapper";
import {ResolutionStructureResultSchema} from "@/parser/schemas/structure_parser/result";

const schemaDescription = zodToLLMDescription(ResolutionStructureResultSchema);

export async function parseResolutionStructure(fileContent: string): Promise<ResultWithData<ResolutionStructure, LLMError>> {
    console.log("calling structure parser model...");
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
        });
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: {code: "api_error"}
        };
    }
    const jsonParseRes = parseLLMResponse(res, ResolutionStructureResultSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
    if(LLMResult.success){
        return {
            success: true,
            data: LLMResult.data
        }
    }
    else{
        return {
            success: false,
            error: { code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        };
    }
}
