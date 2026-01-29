import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {fetchUnfinishedUploads, fetchUploadHistory} from "@/lib/data/uploads";
import {HistoryView} from "@/components/admin/history-view";

export default async function HistoryPage() {
    await checkResourcePermission("upload", "read");

    const [history, pendingUploads] = await Promise.all([
        fetchUploadHistory(null),
        fetchUnfinishedUploads()
    ]);

    return <HistoryView initialHistory={history} initialPendingUploads={pendingUploads} />
}
