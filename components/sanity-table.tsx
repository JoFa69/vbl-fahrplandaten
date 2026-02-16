"use client"

import { AlertTriangle, AlertCircle, Info, ExternalLink } from "lucide-react"
import { sanityCheckData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const severityConfig = {
  high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/8", badge: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { icon: AlertCircle, color: "text-chart-amber", bg: "bg-chart-amber/8", badge: "bg-chart-amber/10 text-chart-amber border-chart-amber/20" },
  low: { icon: Info, color: "text-chart-sky", bg: "bg-chart-sky/8", badge: "bg-chart-sky/10 text-chart-sky border-chart-sky/20" },
}

export function SanityTable() {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Recent VDV Import Errors / Sanity Checks</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Datenqualitaet und Import-Probleme aus dem letzten VDV-452 Import</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            3 kritisch
          </span>
          <span className="flex items-center gap-1 text-[10px] text-chart-amber font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-amber" />
            3 mittel
          </span>
          <span className="flex items-center gap-1 text-[10px] text-chart-sky font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-sky" />
            2 niedrig
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground w-10" />
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">ID</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Typ</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Linie</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Beschreibung</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">Fahrt</th>
              <th className="py-2.5 px-4 text-right font-medium text-muted-foreground">Zeit</th>
              <th className="py-2.5 px-4 text-right font-medium text-muted-foreground w-10" />
            </tr>
          </thead>
          <tbody>
            {sanityCheckData.map((row, i) => {
              const sev = severityConfig[row.severity as keyof typeof severityConfig]
              const SevIcon = sev.icon
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-muted/40",
                    i % 2 !== 0 && "bg-muted/15"
                  )}
                >
                  <td className="py-2.5 px-4">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", sev.bg)}>
                      <SevIcon className={cn("w-3.5 h-3.5", sev.color)} />
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{row.id}</td>
                  <td className="py-2.5 px-4">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border", sev.badge)}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-card-foreground">{row.line}</td>
                  <td className="py-2.5 px-4 text-card-foreground max-w-[300px] truncate">{row.detail}</td>
                  <td className="py-2.5 px-4 font-mono text-muted-foreground">{row.trip}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">{row.timestamp}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Details">
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
