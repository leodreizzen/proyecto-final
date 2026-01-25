import { ResolutionNaturalID } from "@/lib/definitions/resolutions";
import Link from "next/link";
import {formatResolutionId} from "@/lib/utils";
import {pathForResolution} from "@/lib/paths";

export function AddedNotice({ id }: { id: ResolutionNaturalID | null }) {
    if (!id || id.year === 0) return null;

    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <span>Agregado por</span>
            <Link 
                href={pathForResolution(id)}
                className="hover:underline font-bold"
            >
                Res. {formatResolutionId(id)}
            </Link>
        </span>
    );
}
