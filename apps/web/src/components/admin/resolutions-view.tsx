import { KpiHeader } from "./kpi-header"
import { Toolbar } from "./toolbar"
import { ResolutionsTable } from "./resolutions-table"
import { StatusPanel } from "./status-panel"
import {fetchResolutionsWithStatus} from "@/lib/data/resolutions";

const MOCK_JOBS = [
  { id: "1", filename: "Placeholder1.pdf", progress: 60, phase: "Analizando IA..." },
  { id: "2", filename: "Placeholder2.pdf", progress: 20, phase: "Subiendo..." },
]

const MOCK_RECENT = [
  { id: "1", filename: "Placeholder1.pdf", status: "success" as const, time: "Hace 2 min" },
  {
    id: "2",
    filename: "Res_Falla.pdf",
    status: "error" as const,
    time: "Hace 10 min",
    error: "PDF corrupto o formato no válido",
  },
  { id: "3", filename: "Placeholder2.pdf", status: "success" as const, time: "Hace 15 min" },
]

export async function ResolutionsView() {
  const resolutions = await fetchResolutionsWithStatus();

  const stats = {
    total: resolutions.length,
    inQueue: MOCK_JOBS.length,
    missing: resolutions.filter((r) => r.status !== "ok").length,
    inconsistent: resolutions.filter((r) => r.status === "inconsistent").length,
  }

  return (
    <div className="flex flex-col xl:flex-row h-full">
      {/* Main content - Central column */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
        <KpiHeader stats={stats} />
        <Toolbar searchQuery={""} onSearchChange={() => {}} />
        <ResolutionsTable resolutions={resolutions} onDelete={() => {}} />
      </div>

      {/* Status panel - Right column */}
      <div className="xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50">
        <StatusPanel jobs={MOCK_JOBS} recentItems={MOCK_RECENT} />
      </div>
    </div>
  )
}
