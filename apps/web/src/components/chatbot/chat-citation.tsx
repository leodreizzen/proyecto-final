"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";


interface PrecomputedChatCitationProps {
    index: number;
    data: {
        title: string;
        source: string;
        quote: string;
        href?: string | null;
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
                    {data.href && (
                        <div className="p-2 border-t bg-muted/20 flex justify-end">
                            <Link href={data.href} target="_blank" prefetch={false} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium px-2 py-1">
                                Ver resolución completa
                                <ExternalLinkIcon className="size-3" />
                            </Link>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
