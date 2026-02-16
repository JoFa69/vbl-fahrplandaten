"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { routeComplexityData } from "@/lib/mock-data"

export function RouteComplexityChart() {
  const total = routeComplexityData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-card-foreground mb-1">
        Route Complexity
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Verteilung Standardrouten vs. Varianten
      </p>
      <div className="flex-1 flex items-center justify-center min-h-[240px]">
        <div className="relative w-[200px] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={routeComplexityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {routeComplexityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-card-foreground">{total}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Routen</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        {routeComplexityData.map(item => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-semibold text-card-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
