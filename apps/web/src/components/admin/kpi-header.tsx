import { FileCheck, Zap, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react";
import Link from "next/link";

interface KpiHeaderProps {
  stats: {
    total: number
    inQueue: number
    missing: number
    failedTasks: number
  }
}

const KPI_CONFIG: {
  key: keyof KpiHeaderProps["stats"],
  label: string,
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
  color: string,
  bg: string,
  href?: string
}[] = [
    {
      key: "total",
      label: "Subidas",
      icon: FileCheck,
      color: "text-status-success",
      bg: "bg-status-success/10",
    },
    { key: "inQueue", label: "En Cola", icon: Zap, color: "text-status-info", bg: "bg-status-info/10" },
    { key: "missing", label: "Faltantes", icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10", href: "/admin/revision" },
    { key: "failedTasks", label: "Tareas Fallidas", icon: AlertCircle, color: "text-status-error", bg: "bg-status-error/10", href: "/admin/revision" },
  ]

export function KpiHeader({ stats }: KpiHeaderProps) {
  return (
    <div className="flex gap-4 lg:gap-4 xl:gap-5 mb-4 md:mb-6">
      {KPI_CONFIG.map((kpi) => {
        const Content = (
          <div className={cn("flex-1 min-w-0 flex max-sm:flex-col items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 rounded-xl bg-card border border-border h-full", kpi.href && "hover:bg-muted/50 transition-colors")}>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", kpi.bg)}>
              <kpi.icon className={cn("h-5 w-5", kpi.color)} />
            </div>
            <div className="flex flex-col max-sm:flex-col-reverse max-sm:w-full max-sm:gap-1">
              <p className="text-xl md:text-2xl font-bold text-foreground max-sm:text-center">{stats[kpi.key]}</p>
              <p className="text-xs text-muted-foreground text-center truncate">{kpi.label}</p>
            </div>
          </div>
        )
        if (kpi.href) {
          return (
            <Link key={kpi.key} href={kpi.href} prefetch={false} className="flex-1 min-w-0">
              {Content}
            </Link>
          )
        }

        return (
          <div key={kpi.key} className="flex-1 min-w-0">
            {Content}
          </div>
        )
      })}
    </div>
  )
}
