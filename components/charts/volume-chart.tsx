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
} from "recharts"
import { volumeData } from "@/lib/mock-data"

export function VolumeChart() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-card-foreground">
          Fahrten und Linienverlauf pro Linie
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Vergleich der Anzahl Fahrten und Verlaufspunkte
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={volumeData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
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
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
          />
          <Bar dataKey="fahrten" name="Fahrten" fill="var(--color-chart-blue)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="verlauf" name="Verlaufspunkte" fill="var(--color-chart-cyan)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
