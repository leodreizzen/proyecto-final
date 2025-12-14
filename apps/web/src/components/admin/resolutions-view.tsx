import { KpiHeader } from "./kpi-header"
import { Toolbar } from "./toolbar"
import { ResolutionsTable } from "./resolutions-table"
import { StatusPanel } from "./status-panel"
import {countResolutions, fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {fetchUnfinishedUploads, fetchRecentFinishedUploads} from "@/lib/data/uploads";

export async function ResolutionsView() {
  const resolutions = await fetchResolutionsWithStatus();
  const pendingUploads = await fetchUnfinishedUploads();
  const recentFinishedUploads = await fetchRecentFinishedUploads();
  const resCount = await countResolutions();

  const stats = {
    total: resCount,
    inQueue: pendingUploads.length,
    missing: resolutions.filter((r) => r.status !== "ok").length, //TODO
    inconsistent: resolutions.filter((r) => r.status === "inconsistent").length, //TODO
  }

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* Main content - Central column */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
        <KpiHeader stats={stats} />
        <Toolbar />
        <ResolutionsTable resolutions={resolutions} />
      </div>

      {/* Status panel - Right column */}
      <div className="xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50">
        <StatusPanel unfinished={pendingUploads} recent={recentFinishedUploads} />
      </div>
    </div>
  )
}
