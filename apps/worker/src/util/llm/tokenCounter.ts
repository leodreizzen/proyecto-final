import {Tiktoken} from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

const encoder = new Tiktoken(o200k_base);
export function countTokens(text: string): number {
    return encoder.encode(text).length;
}