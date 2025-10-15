export type ResultVoid<R = string> = { success: true } | {
    success: false,
    error: R
}

export type ResultWithData<T, R = string> = { success: true, data: T } | {
    success: false,
    error: R
};

export type LLMError = {
    code: "no_response" | "api_error" | "parse_error"
}