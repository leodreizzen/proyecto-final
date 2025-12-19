import {ParseResolutionError} from "@/parser/types";

export class ResolutionRejectError extends Error {
    error: ParseResolutionError;

    constructor(error: ParseResolutionError) {
        super(`Resolution rejected: ${JSON.stringify(error)}`);
        this.name = "ResolutionRejectError";
        this.error = error;
    }
}

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatErrorMessage(e: any): string {
    let errorMessage;
    if (e instanceof ResolutionRejectError) {
        switch (e.error.code) {
            case "too_large":
                errorMessage = "El archivo es demasiado grande";
                break;
            case "invalid_format":
                errorMessage = `Archivo inválido: ${e.error.message}`;
                break;
            default: {
                const _exhaustiveCheck: never = e.error;
                return "Error desconocido";
            }
        }
    } else {
        errorMessage = "Error interno";
    }
    return errorMessage;
}