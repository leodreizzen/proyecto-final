import {ZodError, ZodType} from "zod";
import {ResultWithData} from "@/definitions";
import {jsonrepair} from "jsonrepair";

type parseError<T> = {
    code: "invalid_json",
} | {
    code: "zod_error",
    details: ZodError<T>;
}

type ParseStringWithZodObjectResult<O> = ResultWithData<O, parseError<O>>;

export function parseStringWithZodObject<O, I>(str: string, schema: ZodType<O, I>): ParseStringWithZodObjectResult<O> {
    let obj;
    try {
        obj = JSON.parse(str);
    } catch {
        return {
            success: false,
            error: { code: "invalid_json"}
        };
    }

    const parseResult = schema.safeParse(obj);
    if (!parseResult.success) {
        return {
            success: false,
            error: {
                code: "zod_error",
                details: parseResult.error
            }
        };
    }
    return {
        success: true,
        data: parseResult.data
    };
}

export function parseLLMStringWithZodObject<O, I>(str: string, schema: ZodType<O, I>): ParseStringWithZodObjectResult<O> {
    const repairedStr = jsonrepair(str);
    return parseStringWithZodObject(repairedStr, schema);
}