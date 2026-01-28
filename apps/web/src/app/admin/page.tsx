import {authCheck} from "@/lib/auth/route-authorization";
import {ResolutionsView} from "@/components/admin/resolutions-view";
import {countResolutions, fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {fetchRecentFinishedUploads, fetchUnfinishedUploads} from "@/lib/data/uploads";

export default async function AdminPage() {
    await authCheck(["ADMIN"]);
    const [resolutions, pendingUploads, recentFinishedUploads, resCounts] = await Promise.all([
        fetchResolutionsWithStatus(null),
            fetchUnfinishedUploads(),
            fetchRecentFinishedUploads(),
            countResolutions()
        ]);

    return <ResolutionsView resolutions={resolutions} pendingUploads={pendingUploads}
                            recentFinishedUploads={recentFinishedUploads} resCounts={resCounts}/>;
}
