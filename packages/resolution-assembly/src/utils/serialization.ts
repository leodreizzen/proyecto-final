import stringify from "json-stable-stringify";

export function stableStringify(data: unknown): string {
    return stringify(data) ?? "";
}