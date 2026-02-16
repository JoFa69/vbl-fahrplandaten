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
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-1">
        Service Frequency & Speed by Hour
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Abfahrten und Durchschnittsgeschwindigkeit nach Tageszeit
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={frequencySpeedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickFormatter={v => `${v}h`}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Abfahrten", angle: -90, position: "insideLeft", offset: 20, style: { fontSize: 10, fill: "var(--color-muted-foreground)" } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[15, 28]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "km/h", angle: 90, position: "insideRight", offset: 15, style: { fontSize: 10, fill: "var(--color-muted-foreground)" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelFormatter={v => `${v}:00 Uhr`}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            />
            <Bar
              yAxisId="left"
              dataKey="departures"
              name="Abfahrten"
              fill="var(--color-chart-blue)"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="speed"
              name="Geschwindigkeit (km/h)"
              stroke="var(--color-chart-sky)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--color-chart-sky)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
