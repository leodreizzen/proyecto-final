import {ParseResolutionError} from "@/parser/types";

export class ResolutionRejectError extends Error {
    error: ParseResolutionError;

    constructor(error: ParseResolutionError) {
        super(`Resolution rejected: ${JSON.stringify(error)}`);
        this.name = "ResolutionRejectError";
        this.error = error;

        Object.setPrototypeOf(this, ResolutionRejectError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ResolutionRejectError);
        }
    }
}

export class ResolutionExistsError extends Error {
    id: { initial: string; number: number; year: number };
    constructor(resolutionId: { initial: string; number: number; year: number }) {
        super(`Resolution already exists: ${JSON.stringify(resolutionId)}`);
        this.name = "ResolutionExistsError";
        this.id = resolutionId;

        Object.setPrototypeOf(this, ResolutionExistsError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ResolutionExistsError);
        }
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
    } else if (e instanceof ResolutionExistsError) {
        errorMessage = `Ya existe una resolución con este identificador (${e.id.initial}-${e.id.number}-${e.id.year})`;
    } else {
        errorMessage = "Error interno";
    }
    return errorMessage;
}