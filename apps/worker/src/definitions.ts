export function resultVoidSuccess(): ResultVoid {
    return { success: true };
}

export function resultVoidError<T>(error: T): ResultVoid<T> {
    return { success: false, error };
}

export function resultWithDataSuccess<T>(data: T): ResultWithData<T> {
    return { success: true, data };
}

export function resultWithDataError<T, R>(error: R): ResultWithData<T, R> {
    return { success: false, error };
}

export type ResultVoid<R = string> = { success: true } | {
    success: false,
    error: R
}

export type ResultWithData<T, R = string> = { success: true, data: T } | {
    success: false,
    error: R
};

export const llmErrorCodes = ["invalid_format", "other_error"] as const;
