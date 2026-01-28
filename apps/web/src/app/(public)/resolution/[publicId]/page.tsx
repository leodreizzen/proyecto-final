import {notFound, redirect} from "next/navigation";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {ResolutionViewer} from "@/components/resolution/resolution-viewer";
import {changeDateInResolutionParams, slugToResID} from "@/lib/paths";
import {getAssembledResolution} from "@/lib/assembly/assemble-resolution";
import {getResolutionIdByNaturalKey} from "@/lib/data/resolutions";
import {ResolutionNaturalID} from "@/lib/definitions/resolutions";


export default async function ResolutionPage({params, searchParams: searchParamsPromise}: {
    params: Promise<{ publicId: string }>,
    searchParams: Promise<{ [key in "date"]: string | string[] | undefined }>
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
    let dateToSearch = null;
    if (dateParam !== undefined) {
        if (Array.isArray(dateParam)) {
            changeDateServer(resId, searchParams, null);
        }
        dateToSearch = new Date(dateParam as string);
        if (isNaN(dateToSearch.getTime())) {
            changeDateServer(resId, searchParams, null);
        }
    }

    const {resolutionData, versions: versionsAsc, inapplicableChanges} = await getAssembledResolution(resUUID, dateToSearch);

    const versions = versionsAsc.reverse();

    let currentVersion;
    if (dateToSearch) {
        currentVersion = versions.find(v => v.date.getTime() === dateToSearch.getTime()) || null;
    }

    if (!currentVersion && dateToSearch) {
        changeDateServer(resId, searchParams, null);
    }

    if (!currentVersion) {
        currentVersion = versions[0]!;
    }

    return <ResolutionViewer resolution={resolutionData} versions={versions} currentVersion={currentVersion} inapplicableChanges={inapplicableChanges}/>;
}

function changeDateServer(resoutionId: ResolutionNaturalID, searchParams: { [key: string]: string | string[] | undefined }, date: Date | null) {
    const newSearchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
        if (key === "date") continue;
        if (value !== undefined && value !== null) {
            newSearchParams.set(key, Array.isArray(value) ? value.join(",") : value);
        }
    }

    redirect(changeDateInResolutionParams(resoutionId, newSearchParams, date));
}

