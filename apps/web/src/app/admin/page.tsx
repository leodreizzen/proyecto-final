import {authCheck} from "@/lib/auth/route-authorization";
import {ResolutionsView} from "@/components/admin/resolutions-view";
import {countResolutions, fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {fetchRecentFinishedUploads, fetchUnfinishedUploads} from "@/lib/data/uploads";

export default async function AdminPage(props: { searchParams: Promise<{ q?: string }> }) {
    await authCheck(["ADMIN"]);
    const searchParams = await props.searchParams;
    const query = typeof searchParams.q === "string" ? searchParams.q || "" : "";

    const [resolutions, pendingUploads, recentFinishedUploads, resCounts] = await Promise.all([
        fetchResolutionsWithStatus(null, query),
        fetchUnfinishedUploads(),
        fetchRecentFinishedUploads(),
        countResolutions()
    ]);

    return <ResolutionsView resolutions={resolutions} pendingUploads={pendingUploads}
                            recentFinishedUploads={recentFinishedUploads} resCounts={resCounts}
                            initialSearch={query}/>;
}
