import {LLMError, ResultWithData} from "@/definitions";
import {parseLLMStringWithZodObject} from "@/util/jsonparse";
import {z} from "zod";
import { ChatCompletion } from "openai/resources";

export function parseLLMResponse<T>(res: ChatCompletion, schema: z.ZodType<T>): ResultWithData<T, LLMError> {
    if (!res.choices || res.choices.length === 0) {
        return {
            success: false,
            error: {code: "no_response"}
        };
    }

    const message = res.choices[0]!.message.content;
    if (!message)
        return {
            success: false,
            error: {code: "no_response"}
        }
    const messageToParse = message.replace(/<br>/g, "\n");
    const parseResult = parseLLMStringWithZodObject(messageToParse, schema);
    if (!parseResult.success) {
        console.error("Parse error:\n" + JSON.stringify(parseResult.error, null, 2)); // TODO proper formatting
        return {
            success: false,
            error: {code: "parse_error"}
        };
    }
    return {
        success: true,
        data: parseResult.data
    };
}