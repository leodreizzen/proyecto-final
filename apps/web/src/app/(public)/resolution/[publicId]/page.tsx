import {notFound} from "next/navigation";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {ResolutionViewer} from "@/components/resolution/resolution-viewer";
import {slugToResID} from "@/lib/paths";
import {getAssembledResolution} from "@/lib/assembly/assemble-resolution";
import {getResolutionIdByNaturalKey} from "@/lib/data/resolutions";


export default async function ResolutionPage({params}: { params: Promise<{ publicId: string }> }) {
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
    const resolutionData = await getAssembledResolution(resUUID, null);

    const mockVersions = [
        {date: new Date(), causedBy: {initial: "CSU", number: 1400, year: 2025}},
        {date: new Date("2026-01-01"), causedBy: {initial: "CSU", number: 100, year: 2010}},
        {date: resolutionData.date, causedBy: resolutionData.id}
    ]; // TODO get real versions

    const currentVersion = mockVersions[0]!;

    return <ResolutionViewer resolution={resolutionData} versions={mockVersions} currentVersion={currentVersion}/>;
}
