import {parseLLMStringWithZodObject} from "@/util/llm/json_parse";
import {z, ZodType} from "zod";
import { ChatCompletion } from "@repo/ai/openai_wrapper";
import {LLMAPIError} from "@/parser/llms/errors";

export function parseLLMResponse<S extends ZodType>(res: ChatCompletion, schema: S): z.infer<S> {
    if (!res.choices || res.choices.length === 0) {
        throw new LLMAPIError("No choices in LLM response", "no_response", null);
    }

    const message = res.choices[0]!.message.content;
    if (!message)
        throw new LLMAPIError("No content in LLM response", "no_response", null);

    const messageToParse = message.replace(/<br>/g, "\n");
    return parseLLMStringWithZodObject(messageToParse, schema);
}