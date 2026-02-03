import {notFound, redirect} from "next/navigation";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {ResolutionViewer} from "@/components/resolution/resolution-viewer";
import {changeVersionInResolutionParams, resIDToSlug, slugToResID} from "@/lib/paths";
import {getAssembledResolution} from "@/lib/assembly/assemble-resolution";
import {getResolutionIdByNaturalKey} from "@/lib/data/resolutions";
import {ResolutionNaturalID} from "@/lib/definitions/resolutions";
import type {Metadata, ResolvingMetadata} from 'next'
import {formatResolutionId} from "@/lib/utils";

type Props = {
    params: Promise<{ publicId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}


export async function generateMetadata(
    {params}: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const publicId = (await params).publicId
    const parentTitle = (await parent).title?.absolute;

    const resId = slugToResID(publicId);
    if (!resId) {
        return {
            title: parentTitle
        }
    }

    return {
        title: `${formatResolutionId(resId)} - ${parentTitle}`,
    }
}


export default async function ResolutionPage({params, searchParams: searchParamsPromise}: {
    params: Promise<{ publicId: string }>,
    searchParams: Promise<{ [key in "date" | "modifier"]: string | string[] | undefined }>
}) {
    await authCheck(publicRoute);

    const {publicId} = await params;
    const resId = slugToResID(publicId);
    if (!resId) {
        notFound();
    }

    const resUUID = await getResolutionIdByNaturalKey(resId);
    if (!resUUID) {
        notFound();
    }

    const searchParams = await searchParamsPromise;
    const dateParam = searchParams.date;
    const modifierParam = searchParams.modifier;

    // Normalize Params
    const dateStr = Array.isArray(dateParam) ? dateParam[0] : dateParam;
    const modifierStr = Array.isArray(modifierParam) ? modifierParam[0] : modifierParam;

    let dateToSearch: Date | null = null;
    if (dateStr) {
        dateToSearch = new Date(dateStr);
        if (isNaN(dateToSearch.getTime())) {
            changeVersionServer(resId, searchParams, null, null);
        }
    }

    const {
        resolutionData,
        versions: versionsAsc,
        inapplicableChanges
    } = await getAssembledResolution(resUUID, dateToSearch, modifierStr ?? null);

    const versions = versionsAsc.reverse();

    let currentVersion;

    if (modifierStr) {
        const modifierSlug = modifierStr;
        currentVersion = versions.find(v => resIDToSlug(v.causedBy) === modifierSlug);
    }

    if (!currentVersion && dateToSearch) {
        // fallback: date match
        currentVersion = versions.find(v => v.date.getTime() === dateToSearch!.getTime());
    }

    // fallback to Latest version
    if (!currentVersion) {
        currentVersion = versions[0];
        if (!currentVersion) {
            throw new Error("Resolution has no versions");
        }
    }


    const isInitialVersion = currentVersion &&
        currentVersion.causedBy.initial === resId.initial &&
        currentVersion.causedBy.number === resId.number &&
        currentVersion.causedBy.year === resId.year;

    // Redirects if URL params do not match the canonical version info

    // Case A: Invalid modifier param
    if (modifierStr && (!currentVersion || resIDToSlug(currentVersion.causedBy) !== modifierStr)) {
        const targetModifier = isInitialVersion ? null : resIDToSlug(currentVersion.causedBy);
        changeVersionServer(resId, searchParams, currentVersion.date, targetModifier);
    }     // Case B: Modifier is Valid, but Date in URL does not match actual version date
    else if (currentVersion && dateToSearch && currentVersion.date.getTime() !== dateToSearch.getTime()) {
        const targetModifier = isInitialVersion ? null : resIDToSlug(currentVersion.causedBy);
        changeVersionServer(resId, searchParams, currentVersion.date, targetModifier); // Fix Date
    }     // Case C: Date is present, but Modifier is MISSING (except initial version).
    else if (dateToSearch && !modifierStr && currentVersion && !isInitialVersion) {
        changeVersionServer(resId, searchParams, currentVersion.date, resIDToSlug(currentVersion.causedBy));
    }

    return <ResolutionViewer resolution={resolutionData} versions={versions} currentVersion={currentVersion!}
                             inapplicableChanges={inapplicableChanges}/>;
}

function changeVersionServer(resolutionId: ResolutionNaturalID, searchParams: {
    [key: string]: string | string[] | undefined
}, date: Date | null, modifier: string | null) {
    const newSearchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
        if (key === "date" || key === "modifier") continue;
        if (value !== undefined && value !== null) {
            newSearchParams.set(key, Array.isArray(value) ? value.join(",") : value);
        }
    }

    redirect(changeVersionInResolutionParams(resolutionId, newSearchParams, date, modifier));
}

