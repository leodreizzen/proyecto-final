import { ResolutionToShow } from "@/lib/definitions/resolutions";
import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {pathForResolution} from "@/lib/paths";
import {formatDate} from "@/lib/utils";

interface VersionStatusProps {
    resolution: ResolutionToShow;
    isCurrentVersion: boolean; // Is this the latest version in time?
}

export function VersionStatus({ resolution, isCurrentVersion }: VersionStatusProps) {
    if (isCurrentVersion && resolution.repealedBy === null) return null;

    if (resolution.repealedBy !== null) {
        return (
            <div className="w-full bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 p-4">
                <div className="container mx-auto flex items-center gap-3 text-red-800 dark:text-red-200">
                    <XCircle className="h-6 w-6 shrink-0" />
                    <div>
                        <p className="font-bold">Resolución derogada</p>
                        <p className="text-sm opacity-90">Esta resolución fue derogada por
                            <Link className="font-bold hover:underline ml-1" href={pathForResolution(resolution.repealedBy)}>
                                {resolution.repealedBy.initial}-{resolution.repealedBy.number}-{resolution.repealedBy.year}</Link>.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isCurrentVersion) {
        return (
            <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 p-4">
                <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-100">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 shrink-0" />
                        <div>
                            <p className="font-bold">VERSIÓN HISTÓRICA</p>
                            <p className="text-sm opacity-90">
                                Estás viendo una versión histórica del {formatDate(resolution.date)}.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100" asChild>
                        <Link href={`/resolution/CSU-${resolution.id.number}-${resolution.id.year}`}>
                            Ir a Vigente
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
