"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { infraData } from "@/lib/mock-data"

const COLORS = [
  "var(--color-chart-blue)",
  "var(--color-chart-cyan)",
  "var(--color-chart-green)",
  "var(--color-chart-amber)",
  "var(--color-chart-rose)",
]

export function InfraChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-card-foreground">
          Infrastruktur-Elemente
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Anzahl Eintraege pro Infrastruktur-Typ
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={infraData}
          layout="vertical"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            width={120}
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
          <Bar dataKey="count" name="Anzahl" radius={[0, 4, 4, 0]}>
            {infraData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
