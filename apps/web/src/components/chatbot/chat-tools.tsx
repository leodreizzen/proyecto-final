import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpenIcon, ChevronDownIcon, DatabaseIcon, InfoIcon } from "lucide-react";
import { formatResolutionId } from "@/lib/utils";
import { IdLookupInput, SearchToolInput } from "@/lib/chatbot/tools/schemas";

export const SearchTool = ({ input, query }: { input?: SearchToolInput, query?: string }) => {
    const searchType = input?.searchType === 'SEMANTIC' ? 'Semántica' : 'Palabras clave';

    return (
        <Collapsible defaultOpen className="group/collapsible w-full border rounded-md bg-muted/30">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-md">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <DatabaseIcon className="size-4" />
                    <span>Buscó en la base de datos</span>
                </div>
                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3 text-sm space-y-3 border-t">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                    <span className="text-muted-foreground text-xs font-semibold uppercase">Tipo de búsqueda</span>
                    <div>
                        <Badge variant="outline" className="text-xs font-normal">
                            {searchType}
                        </Badge>
                    </div>

                    <span className="text-muted-foreground text-xs font-semibold uppercase">Consulta</span>
                    <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border border-border/50 text-foreground break-all">
                        {query || "—"}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export const IdLookupTool = ({ input }: { input?: IdLookupInput }) => {
    const formattedId = input ? formatResolutionId(input) : '—';

    return (
        <Collapsible defaultOpen className="group/collapsible w-full border rounded-md bg-muted/30">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-md">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpenIcon className="size-4" />
                    <span>Buscó una resolución específica</span>
                </div>
                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3 text-sm space-y-3 border-t">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                    <span className="text-muted-foreground text-xs font-semibold uppercase">Id de resolución</span>
                    <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border border-border/50 text-foreground">
                        {formattedId}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export const DatabaseInfoTool = () => {
    return (
        <div className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground bg-muted/30 border rounded-md">
            <InfoIcon className="size-4" />
            <span>Obtuvo información general</span>
        </div>
    );
};
