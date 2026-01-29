import {fetchUnfinishedUploads, fetchUploadHistory} from "@/lib/data/uploads";
import {HistoryView} from "@/components/admin/history-view";
import {authCheck} from "@/lib/auth/route-authorization";

export default async function HistoryPage() {
    await authCheck(["ADMIN"])

    const [history, pendingUploads] = await Promise.all([
        fetchUploadHistory(null),
        fetchUnfinishedUploads()
    ]);

    return <HistoryView initialHistory={history} initialPendingUploads={pendingUploads} />
}
