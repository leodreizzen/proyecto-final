import {z, ZodError, ZodType} from "zod";
import {jsonrepair} from "jsonrepair";
import {InvalidLLMResponseError, LLMOutputParseError} from "@/parser/llms/errors";


export function parseStringWithZodObject<S extends ZodType>(str: string, schema: S): z.infer<S> {
    const obj = JSON.parse(str);
    return schema.parse(obj);
}

export function parseLLMStringWithZodObject<S extends ZodType>(str: string, schema: S): z.infer<S> {
    let repairedStr;
    try{
        repairedStr = jsonrepair(str);
        return parseStringWithZodObject(repairedStr, schema);
    } catch (e){
        if (e instanceof ZodError) {
             throw new LLMOutputParseError("Error parsing LLM response", e);
        }
        else
            throw new InvalidLLMResponseError("Invalid JSON response from LLM");
    }
}