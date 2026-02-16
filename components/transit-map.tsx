"use client"

import { useState } from "react"
import { Maximize2, Layers, ZoomIn, ZoomOut } from "lucide-react"
import { mapStops, mapRoutes } from "@/lib/mock-data"

const lineColors: Record<string, string> = {
  "1": "#1e3a5f",
  "2": "#10b981",
  "3": "#f59e0b",
  "5": "#38bdf8",
  "6": "#8b5cf6",
  "7": "#f43f5e",
  "10": "#64748b",
  "12": "#ec4899",
}

export function TransitMap() {
  const [hoveredStop, setHoveredStop] = useState<string | null>(null)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Netzwerk Luzern</h3>
          <p className="text-[11px] text-muted-foreground">Liniennetz mit Haltestellen</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Layers">
            <Layers className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-map-bg min-h-[280px]">
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-map-road)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Water body */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <ellipse cx="48%" cy="92%" rx="30%" ry="18%" fill="var(--color-map-water)" opacity="0.4" />
        </svg>

        {/* Routes */}
        <svg className="absolute inset-0 w-full h-full">
          {mapRoutes.map((route, i) => {
            const from = mapStops[route.from]
            const to = mapStops[route.to]
            return (
              <line
                key={i}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke={lineColors[route.line] || "#94a3b8"}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.7"
              />
            )
          })}

          {/* Stops */}
          {mapStops.map((stop, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredStop(stop.name)}
              onMouseLeave={() => setHoveredStop(null)}
              className="cursor-pointer"
            >
              <circle
                cx={`${stop.x}%`}
                cy={`${stop.y}%`}
                r={hoveredStop === stop.name ? 6 : 4}
                fill={stop.name === "HB Luzern" ? "var(--color-chart-sky)" : "var(--color-card)"}
                stroke={stop.name === "HB Luzern" ? "var(--color-chart-blue)" : "var(--color-muted-foreground)"}
                strokeWidth={stop.name === "HB Luzern" ? 2.5 : 1.5}
                className="transition-all"
              />
              {(hoveredStop === stop.name || stop.name === "HB Luzern") && (
                <text
                  x={`${stop.x}%`}
                  y={`${stop.y - 4}%`}
                  textAnchor="middle"
                  className="text-[9px] font-semibold fill-foreground pointer-events-none"
                >
                  {stop.name}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {Object.entries(lineColors).slice(0, 6).map(([line, color]) => (
              <div key={line} className="flex items-center gap-1.5">
                <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-muted-foreground">Linie {line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[8px] text-muted-foreground/50 bg-card/60 px-1.5 py-0.5 rounded">Transit Planner OS</span>
        </div>
      </div>
    </div>
  )
}
