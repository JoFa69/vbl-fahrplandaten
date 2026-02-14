"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { timeData } from "@/lib/mock-data"

export function TimeChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-card-foreground">
          Fahrten nach Tageszeit
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Verteilung der Fahrten ueber den Tag
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={timeData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fahrtenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-blue)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-chart-blue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="stunde"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              color: "var(--color-card-foreground)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="fahrten"
            name="Fahrten"
            stroke="var(--color-chart-blue)"
            fill="url(#fahrtenGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
