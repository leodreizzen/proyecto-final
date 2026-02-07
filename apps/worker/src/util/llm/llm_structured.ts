import {createOpenAICompletion} from "@repo/ai/openai_wrapper";
import {z, ZodType} from "zod";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {LLMAPIError} from "@/parser/llms/errors";
import {APIError as OpenAIAPIError} from "@repo/ai/openai_wrapper";

export async function structuredLLMCall<T extends ZodType>(
    params: Parameters<typeof createOpenAICompletion>[0],
    zodSchema: T
): Promise<z.infer<T>> {
    let completion
    try{
        completion = await createOpenAICompletion(params);
    } catch (e) {
        if (e instanceof OpenAIAPIError) {
            if(e.status >= 400 && e.status < 500){
                throw new LLMAPIError("Client error calling LLM API", "client_error", e);
            }
            else if(e.status >= 500){
                throw new LLMAPIError("Server error calling LLM API", "server_error", e);
            }
        }
        if (e instanceof Error)
            throw new LLMAPIError("Error calling LLM API", "server_error", e);
        throw e;
    }

    return parseLLMResponse(completion, zodSchema);
}