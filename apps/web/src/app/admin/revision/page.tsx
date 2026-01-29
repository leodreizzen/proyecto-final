import {fetchMissingResolutions} from "@/lib/data/resolutions";
import {RevisionView} from "@/components/admin/revision-view";
import {authCheck} from "@/lib/auth/route-authorization";

export default async function RevisionPage() {
    await authCheck(["ADMIN"])

    const initialResolutions = await fetchMissingResolutions(null, null);

    return <RevisionView initialResolutions={initialResolutions} />
}
