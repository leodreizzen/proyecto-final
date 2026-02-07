"use client";

import { UIMessage } from "@ai-sdk/react";
import { formatResolutionId } from "@/lib/utils";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatCitationProps {
    id: string;
    type: "CHUNK" | "RES";
    parts: UIMessage["parts"] | undefined;
    index: number;
}

export function ChatCitation({ id, type, parts, index }: ChatCitationProps) {
    const citationData = useMemo(() => {
        if (!parts) return null;

        if (type === "CHUNK") {
            for (const part of parts) {
                // Robust check
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = part as any;
                const toolName = p.toolName || p.toolInvocation?.toolName;
                const result = p.result || p.toolInvocation?.result;

                if (toolName === "search" && result) {
                    const results = result as Array<{
                        resolution: {
                            id: string;
                            initial: string;
                            number: number;
                            year: number;
                            title: string
                        };
                        content: string;
                        chunkId: string;
                    }>;

                    const match = results.find((r) => r.chunkId === id);
                    if (match) {
                        return {
                            title: `Resolución ${formatResolutionId(match.resolution)}: ${match.resolution.title}`,
                            source: formatResolutionId(match.resolution),
                            quote: match.content
                        };
                    }
                }
            }
        } else if (type === "RES") {
            for (const part of parts) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = part as any;
                const toolName = p.toolName || p.toolInvocation?.toolName;
                const input = p.args || p.toolInvocation?.args || p.input;
                const result = p.result || p.toolInvocation?.result;


                if (toolName === "idLookup") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const formatted = input ? formatResolutionId(input as any) : '';

                    if (formatted && (id.includes(formatted) || formatted.includes(id))) {
                        return {
                            title: `Resolución ${formatted}`,
                            source: formatted,
                            quote: typeof result === 'string' ? result : "Contenido de la resolución"
                        }
                    }
                }
            }
        }
        return null;
    }, [id, type, parts]);

    if (!citationData) {
        return (
            <span className="inline-flex items-center justify-center align-top -mt-1 mx-0.5">
                <TriangleAlertIcon className="size-3 text-destructive" />
            </span>
        );
    }

    return (
        <PrecomputedChatCitation
            index={index}
            data={citationData}
        />
    );
}

interface PrecomputedChatCitationProps {
    index: number;
    data: {
        title: string;
        source: string;
        quote: string;
    };
}

export function PrecomputedChatCitation({ index, data }: PrecomputedChatCitationProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <span className="cursor-pointer inline-flex items-center justify-center size-5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-foreground/10 hover:bg-primary/10 hover:text-primary hover:ring-primary/20 transition-colors align-top -mt-0.5 mx-0.5 select-none">
                    {index}
                </span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="flex flex-col">
                    <div className="px-4 py-3 border-b bg-muted/20">
                        <p className="text-sm font-semibold text-foreground/80">{data.title}</p>
                    </div>
                    <div className="p-4 max-h-[200px] overflow-y-auto">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {data.quote}
                        </p>
                    </div>
                    {/* Optional Link Placeholder - to be implemented */}
                    {/* <div className="p-2 border-t bg-muted/20">
                         <a href="#" className="text-xs text-primary hover:underline">Ver resolución completa</a>
                     </div> */}
                </div>
            </PopoverContent>
        </Popover>
    );
}
