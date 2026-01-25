import {ResolutionToShow, ResolutionNaturalID, ResolutionVersion} from "@/lib/definitions/resolutions";
import {Download, Info} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {formatDateUTC} from "@/lib/utils";
import {pathForResolution} from "@/lib/paths";

interface ResolutionHeaderProps {
    resolution: ResolutionToShow;
    affectedBy?: { id: string; name: string }[]; // Mocking this for now as it's not in the main type
}

function getUniqueModifiers(resolution: ResolutionToShow, versions: ResolutionVersion[], currentVersion: ResolutionVersion) {
    const modifiersMap = new Map<string, ResolutionNaturalID>();

    const add = (id: ResolutionNaturalID | null) => {
        if (id) {
            const key = `${id.initial}-${id.number}-${id.year}`;
            modifiersMap.set(key, id);
        }
    };

    add(resolution.ratifiedBy)
    add(resolution.repealedBy);


    // Articles (modifiedBy & repealedBy)
    resolution.articles.forEach(art => {
        if (art.modifiedBy) art.modifiedBy.forEach(add);
        add(art.repealedBy);
    });

    // 2. Annexes
    resolution.annexes.forEach(annex => {
        add(annex.repealedBy);
        add(annex.addedBy)

        if (annex.type === "WITH_ARTICLES") {
            // Standalone Articles
            annex.standaloneArticles.forEach(art => {
                if (art.modifiedBy) art.modifiedBy.forEach(add);
                add(art.addedBy);
                add(art.repealedBy);
            });

            // Chapters
            annex.chapters.forEach(chap => {
                add(chap.repealedBy);
                // Chapter Articles
                chap.articles.forEach(art => {
                    if (art.modifiedBy) art.modifiedBy.forEach(add);
                    add(art.addedBy);
                    add(art.repealedBy);
                });
            });
        } else if (annex.type === "TEXT") {
            if (annex.modifiedBy) annex.modifiedBy.forEach(add);
        }
    });

    const directModifiers = Array.from(modifiersMap.values());

    const indirectModifiers = versions.filter(v => v.date <= currentVersion.date)
        .map(v => v.causedBy)
        .filter(m => {
            const key = `${m.initial}-${m.number}-${m.year}`;
            const originalKey = `${resolution.id.initial}-${resolution.id.number}-${resolution.id.year}`;
            return !directModifiers.some(mod => `${mod.initial}-${mod.number}-${mod.year}` === key) && key !== originalKey;
        });

    return {
        direct: directModifiers,
        indirect: indirectModifiers
    }
}

export function ResolutionHeader({resolution, versions, currentVersion}: {
    resolution: ResolutionToShow,
    versions: ResolutionVersion[],
    currentVersion: ResolutionVersion
}) {
    const isRepealed = resolution.repealedBy !== null;
    const isHistorical = currentVersion !== versions[0];

    const {direct: modifiers, indirect: indirectModifiers} = getUniqueModifiers(resolution, versions, currentVersion);

    return (
        <div className="mb-8 border-b pb-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between">
                <div className="space-y-4 flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        {isRepealed ? (
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
                                🔴 Estado: DEROGADA
                            </span>
                        ) : isHistorical ? (
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                🟠 Estado: VERSIÓN ANTIGUA
                            </span>
                        ) : (
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                                🟢 Estado: VIGENTE
                            </span>
                        )}
                        <span className="text-muted-foreground text-sm">
                            {formatDateUTC(resolution.date)}
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
                        {(modifiers.length + indirectModifiers.length) > 0 && (
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-muted-foreground hover:text-foreground font-normal hover:bg-transparent! px-0!"
                                        >
                                            <Info className="h-4 w-4 inline-block align-text-bottom"/>
                                            <span className="font-semibold mr-1">
                                                Afectada por {modifiers.length + indirectModifiers.length} {(modifiers.length + indirectModifiers.length) === 1 ? 'resolución' : 'resoluciones'}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {
                                            modifiers.length > 0 && <>
                                                <DropdownMenuLabel>
                                                    {modifiers.length} {modifiers.length === 1 ? 'resolución modificatoria' : 'resoluciones modificatorias'}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator/>

                                                {modifiers.map((mod, idx) => (
                                                    <DropdownMenuItem key={idx} asChild>
                                                        <Link href={`/resolution/${mod.initial}-${mod.number}-${mod.year}`}
                                                              className="cursor-pointer">
                                                            Res. {mod.initial}-{mod.number}-{mod.year}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        }
                                        {
                                            indirectModifiers.length > 0 && <>
                                                {modifiers.length > 0 && <DropdownMenuSeparator/>}
                                                <DropdownMenuLabel>
                                                    {indirectModifiers.length} {indirectModifiers.length === 1 ? 'modificación indirecta' : 'modificaciones indirectas'}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator/>

                                                {indirectModifiers.map((mod, idx) => (
                                                    <DropdownMenuItem key={idx} asChild>
                                                        <Link href={`/resolution/${mod.initial}-${mod.number}-${mod.year}`}
                                                              className="cursor-pointer">
                                                            Res. {mod.initial}-{mod.number}-{mod.year}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        }
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        {
                            resolution.ratifiedBy && (
                                <p className="text-muted-foreground">
                                    <span className="font-semibold">Ratificada por:</span> <Link className="hover:underline" href={pathForResolution(resolution.ratifiedBy)}> Res. {resolution.ratifiedBy.initial}-{resolution.ratifiedBy.number}-{resolution.ratifiedBy.year} </Link>
                                </p>
                            )
                        }

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
                        <Download className="h-4 w-4"/>
                        Descargar Original (PDF)
                    </Button>
                </div>
            </div>
        </div>
    );
}
