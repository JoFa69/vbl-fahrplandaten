"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { corridorFrequencyData } from "@/lib/mock-data"
import { GitMerge } from "lucide-react"

export function CorridorChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/8">
            <GitMerge className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Shared Corridor Frequency</h3>
            <p className="text-[11px] text-muted-foreground">Pilatusplatz - HB Luzern (Linie 1 + 4 Combined)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "var(--color-chart-blue)" }} />
            <span className="text-muted-foreground">Linie 1 (10-min Takt)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "var(--color-chart-sky)" }} />
            <span className="text-muted-foreground">Linie 4 (10-min Takt)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-chart-emerald/10">
            <span className="font-semibold text-chart-emerald">= 5-min Combined</span>
          </div>
        </div>
      </div>
      <div className="h-[260px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={corridorFrequencyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={0} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Departures", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "var(--color-muted-foreground)" }, offset: 20 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Bar dataKey="line1" name="Linie 1" stackId="a" fill="var(--color-chart-blue)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="line4" name="Linie 4" stackId="a" fill="var(--color-chart-sky)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
