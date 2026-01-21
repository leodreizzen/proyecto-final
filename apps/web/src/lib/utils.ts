import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {formatInTimeZone} from 'date-fns-tz';
import {Resolution} from "@repo/db/prisma/client";
import _stringify from "json-stable-stringify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date) {
    return formatInTimeZone(date, 'America/Argentina/Buenos_Aires', 'dd-MM-yyyy HH:mm:ss zzz');
}

export function formatResolutionId(resolution: Resolution){
    return `${resolution.initial}-${resolution.number}-${resolution.year}`;
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

export function stableStringify(obj: object): string {
    return _stringify(obj)!;
}