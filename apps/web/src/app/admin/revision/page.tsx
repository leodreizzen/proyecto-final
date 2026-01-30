import {fetchMissingResolutions} from "@/lib/data/resolutions";
import {RevisionView} from "@/components/admin/revision-view";
import {authCheck} from "@/lib/auth/route-authorization";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Revisión"
}


export default async function RevisionPage() {
    await authCheck(["ADMIN"])

    const initialResolutions = await fetchMissingResolutions(null, null);

    return <RevisionView initialResolutions={initialResolutions} />
}
