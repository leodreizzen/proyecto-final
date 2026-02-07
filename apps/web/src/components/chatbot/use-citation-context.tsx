import { useCallback, useMemo } from 'react';
import { UIMessage } from '@ai-sdk/react';
import { IdLookupInput, SearchToolOutput } from "@/lib/chatbot/tools/schemas";
import { formatResolutionId } from "@/lib/utils";
import { CITATION_REGEX_GLOBAL } from "./citation-utils";
import {pathForResolution} from "@/lib/paths";

export type CitationData = {
    title: string;
    source: string;
    quote: string;
    href: string | null;
};

export type CitationContextType = Map<string, { number: number; data: CitationData }>;

export function useCitationContext(messages: UIMessage[]) {
    const findReferencedContent = useCallback((tag: string, id: string) => {
        const messagesToSearch = [...messages].reverse();

        for (const msg of messagesToSearch) {
            if (tag.toUpperCase() === "RES") {
                for (const part of msg.parts) {
                    if (part.type === "tool-idLookup") {
                        const input = part.input as IdLookupInput;
                        const formattedId = input ? formatResolutionId(input) : null;
                        if (formattedId && (formattedId === id || id.includes(formattedId))) {
                            return {
                                title: `Resolución ${formattedId}`,
                                source: formattedId,
                                quote: typeof part.output === 'string' ? part.output : "Contenido de la resolución",
                                href: pathForResolution({
                                    initial: input.initial,
                                    number: input.number,
                                    year: input.year
                                })
                            };
                        }
                    }
                }
            } else if (tag.toUpperCase() === "CHUNK") {
                for (const part of msg.parts) {
                    if (part.type === "tool-search") {
                        const output = part.output as SearchToolOutput;
                        const chunk = output?.find((c) => c.chunkId === id);
                        if (chunk) {
                            const resId = formatResolutionId(chunk.resolution);
                            return {
                                title: `Resolución ${resId}: ${chunk.resolution.title}`,
                                source: resId,
                                quote: chunk.content,
                                href: pathForResolution({
                                    initial: chunk.resolution.initial,
                                    number: chunk.resolution.number,
                                    year: chunk.resolution.year,
                                    articleNumber: chunk.chunkData.articleNumber,
                                    articleSuffix: chunk.chunkData.articleSuffix,
                                    annexNumber: chunk.chunkData.annexNumber,
                                    chapterNumber: chunk.chunkData.chapterNumber
                                })
                            };
                        }
                    }
                }
            }
        }
        return null;
    }, [messages]);

    const citationContext = useMemo(() => {
        const map = new Map<string, { number: number; data: CitationData }>();
        let count = 0;

        messages.forEach(msg => {
            msg.parts.forEach(part => {
                if (part.type === 'text') {
                    const matches = part.text.matchAll(CITATION_REGEX_GLOBAL);
                    for (const match of matches) {
                        const [_, tag, id] = match;
                        const key = `${tag}-${id}`;
                        if (!map.has(key)) {
                            const data = findReferencedContent(tag!, id!);
                            if (data) {
                                map.set(key, { number: ++count, data });
                            }
                        }
                    }
                }
            });
        });
        return map;
    }, [messages, findReferencedContent]);

    return citationContext;
}
