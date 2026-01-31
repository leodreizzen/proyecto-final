import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {formatInTimeZone} from 'date-fns-tz';
import _stringify from "json-stable-stringify";
import {ResolutionNaturalID} from "@/lib/definitions/resolutions";
import {ChangeContext} from "@/lib/definitions/changes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date) {
    return formatInTimeZone(date, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm:ss zzz');
}

export function formatDateUTC(date: Date) {
    return formatInTimeZone(date, 'UTC', 'dd/MM/yyyy');
}

export function formatResolutionId(resolutionID: ResolutionNaturalID): string{
    return `${resolutionID.initial}-${resolutionID.number}-${resolutionID.year}`;
}

export function formatArticleId(
    resId: ResolutionNaturalID,
    articleNumber: number | null,
    articleSuffix: number | null,
    annexNumber: number | null,
    chapterNumber: number | null
): string {
    const resString = formatResolutionId(resId);
    const parts: string[] = [resString];

    if (annexNumber !== null && annexNumber !== undefined) {
        parts.push(`Anexo ${annexNumber}`);
        if (chapterNumber !== null && chapterNumber !== undefined) {
            parts.push(`Capítulo ${chapterNumber}`);
        }
    }

    if (articleNumber !== null && articleNumber !== undefined) {
        const suffixStr = articleSuffix ? ` bis ${articleSuffix}` : '';
        parts.push(`Artículo ${articleNumber}${suffixStr}`);
    }

    return parts.join(' - ');
}

export function formatChangeSource(context: ChangeContext): string {
    return formatArticleId(
        context.rootResolution,
        context.structuralElement.articleNumber,
        context.structuralElement.articleSuffix,
        context.structuralElement.annexNumber,
        context.structuralElement.chapterNumber
    );
}

export function formatUserName(user: {name: string; deleted: boolean}): string {
    return user.deleted ? `Usuario eliminado (${user.name})`: user.name;
}

export function formatChangeType(type: string): string {
    switch (type) {
        case "MODIFY_ARTICLE": return "Modificación de Artículo";
        case "REPLACE_ARTICLE": return "Reemplazo de Artículo";
        case "ADD_ARTICLE": return "Agregado de Artículo";
        case "REPEAL": return "Derogación";
        case "RATIFY_AD_REFERENDUM": return "Ratificación";
        case "REPLACE_ANNEX": return "Reemplazo de Anexo";
        case "ADD_ANNEX": return "Agregado de Anexo";
        case "MODIFY_TEXT_ANNEX": return "Modificación de Texto de Anexo";
        case "APPLY_MODIFICATIONS_ANNEX": return "Aplicación de Anexo de Modificaciones";
        case "ADVANCED": return "Cambio Avanzado";
        default: return type;
    }
}

export function formatMaintenanceTaskType(type: string): string {
    switch (type) {
        case "EVALUATE_IMPACT":
            return "Evaluar Impacto";
        case "PROCESS_ADVANCED_CHANGES":
            return "Procesar Cambios";
        case "CALCULATE_EMBEDDINGS":
            return "Calcular Embeddings";
        default:
            return type;
    }
}

export function formatMaintenanceTaskStatus(status: string): string {
    switch (status) {
        case "PENDING":
            return "PENDIENTE";
        case "PROCESSING":
            return "EN CURSO";
        case "COMPLETED":
            return "LISTA";
        case "FAILED":
            return "FALLIDA";
        default:
            return status;
    }
}

type ValidPath<T> = T extends object
    ? T extends unknown[]
        ? never
        : {
            [K in keyof T]:
            | [K]
            | [K, ...ValidPath<T[K]>]
        }[keyof T]
    : never;

type SetDeep<T, P extends readonly unknown[], V> =
    P extends [infer Head, ...infer Tail]
        ? Head extends keyof T
            ? {
                [K in keyof T]: K extends Head
                    ? SetDeep<T[K], Tail, V>
                    : T[K]
            }
            : never
        : V;
export function assign<T, P extends readonly string[], V>(
    obj: T,
    path: P extends ValidPath<T> ? P : ValidPath<T>,
    value: V
): SetDeep<T, P, V> {
    if (path.length === 0) {
        return value as unknown as SetDeep<T, P, V>;
    }

    const [head, ...tail] = path;

    if (obj === null || typeof obj !== 'object') {
        throw new Error(`Can't access '${String(head)}' property of ${typeof obj}`);
    }

    if(Array.isArray(obj)){
        throw new Error(`Arrays cannot be traversed.`);
    }

    const key = head as keyof T;

    const copy = { ...obj } as T;
    copy[key] = assign(
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        copy[key] as any,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        tail as any,
        value
    ) as T[keyof T];

    return copy as SetDeep<T, P, V>
}

export function formatTimeAgo(date: Date, locale = 'es-AR'): string {
    const now = new Date();
    // Normalize both dates to UTC midnight to compare calendar days only
    const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    
    const diffInDays = Math.floor((utcNow - utcDate) / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) return "Hace menos de un día";

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInDays < 30) return rtf.format(-diffInDays, 'day');
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return rtf.format(-diffInMonths, 'month');
    const diffInYears = Math.floor(diffInDays / 365);
    return rtf.format(-diffInYears, 'year');
}

export function stableStringify(obj: object): string {
    return _stringify(obj)!;
}