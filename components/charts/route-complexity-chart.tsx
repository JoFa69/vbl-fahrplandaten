"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { routeComplexityData } from "@/lib/mock-data"

const COLORS = ["var(--color-chart-blue)", "var(--color-chart-sky)", "var(--color-chart-amber)"]

export function RouteComplexityChart() {
  const total = routeComplexityData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-card-foreground mb-0.5">Route Complexity</h3>
      <p className="text-[11px] text-muted-foreground mb-4">Routen nach Typ</p>
      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={routeComplexityData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {routeComplexityData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-2xl font-bold text-card-foreground">{total}</span>
            <span className="block text-[10px] text-muted-foreground">Routen</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mt-3">
        {routeComplexityData.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-muted-foreground">{d.name}</span>
            </div>
            <span className="font-semibold text-card-foreground">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
