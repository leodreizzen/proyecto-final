"use client";
import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import { Check, Clock } from "lucide-react";
import Link from "next/link";
import {cn, formatDateUTC, formatResolutionId} from "@/lib/utils";
import {useEffect, useRef} from "react";
import {useSearchParams} from "next/navigation";
import {changeVersionInResolutionParams, resIDToSlug} from "@/lib/paths";

interface VersionSelectorProps {
    resolution: ResolutionToShow
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

export function VersionSelector({ resolution, versions, currentVersion }: VersionSelectorProps) {
    const currentVersionRef = useRef<HTMLLIElement | null>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        currentVersionRef.current?.scrollIntoView({block: "center"});
    }, [currentVersionRef]);

    return (
        <ul className="space-y-2">
            {versions.map((ver, idx) => {
                const isCurrent = idx === 0;
                const isActive = ver === currentVersion;
                const isInitialVersion = ver.causedBy.initial === resolution.id.initial && ver.causedBy.number === resolution.id.number && ver.causedBy.year === resolution.id.year;

                const modifierSlug = isInitialVersion ? null : resIDToSlug(ver.causedBy);

                return (
                    <li key={idx} ref={isActive ? currentVersionRef : null}>
                        <Link
                            href={changeVersionInResolutionParams(resolution.id, searchParams, ver.date, modifierSlug)}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md text-sm transition-colors",
                                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {isActive ? (
                                <Check className="h-4 w-4 shrink-0" />
                            ) : (
                                <Clock className="h-4 w-4 shrink-0" />
                            )}

                            <div className="flex flex-col">
                                <span>{formatDateUTC(ver.date)}</span>
                                <span className="text-xs opacity-80">
                                    {isInitialVersion ? "Versión inicial" : (isCurrent ? "(Actual - " : "(") + `Por Res. ${formatResolutionId(ver.causedBy)})`}
                                </span>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
