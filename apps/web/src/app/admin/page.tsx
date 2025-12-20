import {authCheck} from "@/lib/auth/route-authorization";
import {ResolutionsView} from "@/components/admin/resolutions-view";
import {countResolutions, fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {fetchRecentFinishedUploads, fetchUnfinishedUploads} from "@/lib/data/uploads";

export default async function AdminPage() {
    await authCheck(["ADMIN"]);
    const [resolutions, pendingUploads, recentFinishedUploads, resCount] = await Promise.all([
        fetchResolutionsWithStatus(),
            fetchUnfinishedUploads(),
            fetchRecentFinishedUploads(),
            countResolutions()
        ]);

    return <ResolutionsView resolutions={resolutions} pendingUploads={pendingUploads}
                            recentFinishedUploads={recentFinishedUploads} resCount={resCount}/>;
}
