import {FileCheck, Zap, AlertTriangle, AlertCircle} from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react";

interface KpiHeaderProps {
  stats: {
    total: number
    inQueue: number
    missing: number
  inconsistent: number
  }
}

const KPI_CONFIG: {
    key: keyof KpiHeaderProps["stats"],
    label: string,
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
    color: string,
    bg: string,
}[] = [
  {
    key: "total",
    label: "Resoluciones subidas",
    icon: FileCheck,
    color: "text-status-success",
    bg: "bg-status-success/10",
  },
  { key: "inQueue", label: "En Cola", icon: Zap, color: "text-status-info", bg: "bg-status-info/10" },
  { key: "missing", label: "Faltantes", icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10" },
  { key: "inconsistent", label: "Inconsistentes", icon: AlertCircle, color: "text-status-error", bg: "bg-status-error/10" },
]

export function KpiHeader({ stats }: KpiHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {KPI_CONFIG.map((kpi) => (
        <div key={kpi.key} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", kpi.bg)}>
            <kpi.icon className={cn("h-5 w-5", kpi.color)} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats[kpi.key]}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
