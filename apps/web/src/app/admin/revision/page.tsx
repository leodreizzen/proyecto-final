import {fetchMissingResolutions} from "@/lib/data/resolutions";
import {RevisionView} from "@/components/admin/revision-view";
import {authCheck} from "@/lib/auth/route-authorization";
import {Metadata} from "next";
import {fetchMaintenanceTasks} from "@/lib/data/maintenance";

export const metadata: Metadata = {
    title: "Revisión"
}


export default async function RevisionPage() {
    await authCheck(["ADMIN"])

    const initialMissingResolutions = await fetchMissingResolutions(null, null);
    const initialMaintenanceTasks = await fetchMaintenanceTasks({cursor: null, filter: "ALL", query: null});
    return <RevisionView initialMissingResolutions={initialMissingResolutions} initialMaintenanceTasks={initialMaintenanceTasks}/>
}
