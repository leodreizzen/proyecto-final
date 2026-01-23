import { ResolutionToShow, ResolutionIDToShow } from "@/lib/definitions/resolutions";
import { Download, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {formatDate} from "@/lib/utils";

interface ResolutionHeaderProps {
    resolution: ResolutionToShow;
    affectedBy?: { id: string; name: string }[]; // Mocking this for now as it's not in the main type
}

function getUniqueModifiers(resolution: ResolutionToShow): ResolutionIDToShow[] {
    const modifiersMap = new Map<string, ResolutionIDToShow>();

    const add = (id: ResolutionIDToShow | null) => {
        if (id) {
            const key = `${id.initial}-${id.number}-${id.year}`;
            modifiersMap.set(key, id);
        }
    };

    // Resolution
    if(resolution.repealedBy) {
        add(resolution.repealedBy);
    }

    // Articles (modifiedBy & repealedBy)
    resolution.articles.forEach(art => {
        if (art.modifiedBy) art.modifiedBy.forEach(add);
        add(art.repealedBy);
    });

    // 2. Annexes
    resolution.annexes.forEach(annex => {
        add(annex.repealedBy);
        
        if (annex.type === "WithArticles") {
            // Standalone Articles
            annex.standaloneArticles.forEach(art => {
                if (art.modifiedBy) art.modifiedBy.forEach(add);
                add(art.repealedBy);
            });

            // Chapters
            annex.chapters.forEach(chap => {
                add(chap.repealedBy);
                // Chapter Articles
                chap.articles.forEach(art => {
                    if (art.modifiedBy) art.modifiedBy.forEach(add);
                    add(art.repealedBy);
                });
            });
        } else if (annex.type === "TEXT") {
            if (annex.modifiedBy) annex.modifiedBy.forEach(add);
        }
    });

    return Array.from(modifiersMap.values());
}

export function ResolutionHeader({ resolution }: { resolution: ResolutionToShow }) {
    const isRepealed = resolution.repealedBy !== null;
    const isHistorical = false; // TODO: Logic to determine if it's historical but not repealed (e.g. just modified)

    const modifiers = getUniqueModifiers(resolution);

    return (
        <div className="mb-8 border-b pb-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between">
                <div className="space-y-4 flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        {isRepealed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                                🔴 Estado: DEROGADA
                            </span>
                        ) : isHistorical ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                🟠 Estado: VERSIÓN ANTIGUA
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                                🟢 Estado: VIGENTE
                            </span>
                        )}
                        <span className="text-muted-foreground text-sm">
                            {formatDate(resolution.date)}
                        </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-2 mb-2">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">
                            RESOLUCIÓN {resolution.id.initial}-{resolution.id.number}-{resolution.id.year}
                        </h1>
                    </div>

                    {/* Metadata: Modifiers & Case Files */}
                    <div className="space-y-2 text-sm">
                        {modifiers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal hover:bg-transparent! px-0!"
                                        >
                                            <Info className="h-4 w-4 inline-block align-text-bottom" />
                                            <span className="font-semibold mr-1">
                                                Afectada por {modifiers.length} {modifiers.length === 1 ? 'resolución' : 'resoluciones'}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>
                                            {modifiers.length === 1 ? 'Resolución modificatoria' : 'Resoluciones modificatorias'}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {modifiers.map((mod, idx) => (
                                            <DropdownMenuItem key={idx} asChild>
                                                <Link href={`/resolution/${mod.initial}-${mod.number}-${mod.year}`} className="cursor-pointer">
                                                    Res. {mod.initial}-{mod.number}-{mod.year}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                        
                        {resolution.caseFiles.length > 0 && (
                            <p className="text-muted-foreground">
                                <span className="font-semibold">Expedientes:</span> {resolution.caseFiles.join(", ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Download Button */}
                <div className="shrink-0">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Descargar Original (PDF)
                    </Button>
                </div>
            </div>
        </div>
    );
}
