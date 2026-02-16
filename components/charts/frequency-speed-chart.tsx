"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { frequencySpeedData } from "@/lib/mock-data"

export function FrequencySpeedChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-card-foreground mb-0.5">
        Frequency & Speed
      </h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Abfahrten und Geschwindigkeit pro Stunde
      </p>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={frequencySpeedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickFormatter={v => `${v}h`}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[15, 28]}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelFormatter={v => `${v}:00 Uhr`}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
            />
            <Bar
              yAxisId="left"
              dataKey="departures"
              name="Abfahrten"
              fill="var(--color-chart-blue)"
              radius={[3, 3, 0, 0]}
              opacity={0.85}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="speed"
              name="km/h"
              stroke="var(--color-chart-sky)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--color-chart-sky)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
