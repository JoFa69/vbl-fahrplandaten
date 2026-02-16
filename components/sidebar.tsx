"use client"

import { useState, useCallback } from "react"
import {
  Train,
  Calendar,
  Sun,
  Sunrise,
  CloudSun,
  Clock,
  ChevronDown,
  Check,
  Filter,
} from "lucide-react"
import { allLines } from "@/lib/mock-data"

const dayTypes = [
  { id: "weekday", label: "Werktag", icon: Sunrise },
  { id: "saturday", label: "Samstag", icon: CloudSun },
  { id: "sunday", label: "Sonntag", icon: Sun },
]

export function Sidebar() {
  const [dateFrom, setDateFrom] = useState("2025-12-01")
  const [dateTo, setDateTo] = useState("2025-12-31")
  const [selectedDays, setSelectedDays] = useState<string[]>(["weekday"])
  const [selectedLines, setSelectedLines] = useState<string[]>(allLines.slice(0, 3))
  const [linesOpen, setLinesOpen] = useState(false)
  const [timeStart, setTimeStart] = useState(5)
  const [timeEnd, setTimeEnd] = useState(23)

  const toggleDay = useCallback((id: string) => {
    setSelectedDays(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }, [])

  const toggleLine = useCallback((line: string) => {
    setSelectedLines(prev =>
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    )
  }, [])

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar text-sidebar-foreground flex flex-col z-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-active/15">
          <Train className="w-5 h-5 text-sidebar-active" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">Network Operations</h1>
          <p className="text-[11px] text-sidebar-foreground/60">Transit Planner OS</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Date Range */}
        <section>
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            Zeitraum
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-sidebar-muted text-white text-xs rounded-md px-3 py-2 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-active"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full bg-sidebar-muted text-white text-xs rounded-md px-3 py-2 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-active"
            />
          </div>
        </section>

        {/* Day Type */}
        <section>
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 mb-3">
            <Sun className="w-3.5 h-3.5" />
            Tagesart
          </label>
          <div className="space-y-1.5">
            {dayTypes.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                  selectedDays.includes(day.id)
                    ? "bg-sidebar-active/15 text-sidebar-active"
                    : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-white"
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedDays.includes(day.id)
                    ? "bg-sidebar-active border-sidebar-active"
                    : "border-sidebar-border"
                }`}>
                  {selectedDays.includes(day.id) && <Check className="w-2.5 h-2.5 text-sidebar" />}
                </div>
                <day.icon className="w-3.5 h-3.5" />
                {day.label}
              </button>
            ))}
          </div>
        </section>

        {/* Lines Multi-select */}
        <section>
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 mb-3">
            <Filter className="w-3.5 h-3.5" />
            Linien
          </label>
          <div className="relative">
            <button
              onClick={() => setLinesOpen(!linesOpen)}
              className="w-full flex items-center justify-between bg-sidebar-muted text-white text-xs rounded-md px-3 py-2 border border-sidebar-border hover:border-sidebar-active/40 transition-colors"
            >
              <span className="truncate">
                {selectedLines.length === 0
                  ? "Linien waehlen..."
                  : `${selectedLines.length} ausgewaehlt`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${linesOpen ? "rotate-180" : ""}`} />
            </button>
            {linesOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar-muted border border-sidebar-border rounded-md max-h-40 overflow-y-auto z-20">
                {allLines.map(line => (
                  <button
                    key={line}
                    onClick={() => toggleLine(line)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-sidebar-border/50 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                      selectedLines.includes(line)
                        ? "bg-sidebar-active border-sidebar-active"
                        : "border-sidebar-border"
                    }`}>
                      {selectedLines.includes(line) && <Check className="w-2.5 h-2.5 text-sidebar" />}
                    </div>
                    <span className={selectedLines.includes(line) ? "text-white" : ""}>{line}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Time Window Slider */}
        <section>
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50 mb-3">
            <Clock className="w-3.5 h-3.5" />
            Zeitfenster
          </label>
          <div className="flex items-center justify-between text-xs text-white mb-3">
            <span className="font-mono bg-sidebar-muted px-2 py-0.5 rounded">{String(timeStart).padStart(2, "0")}:00</span>
            <span className="text-[10px] text-sidebar-foreground/40">bis</span>
            <span className="font-mono bg-sidebar-muted px-2 py-0.5 rounded">{String(timeEnd).padStart(2, "0")}:00</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-sidebar-foreground/40 mb-1 block">Von</label>
              <input
                type="range"
                min={0}
                max={24}
                value={timeStart}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (v < timeEnd) setTimeStart(v)
                }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer accent-sidebar-active bg-sidebar-muted"
              />
            </div>
            <div>
              <label className="text-[10px] text-sidebar-foreground/40 mb-1 block">Bis</label>
              <input
                type="range"
                min={0}
                max={24}
                value={timeEnd}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (v > timeStart) setTimeEnd(v)
                }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer accent-sidebar-active bg-sidebar-muted"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40 text-center">VBL Fahrplandaten v2.0</p>
      </div>
    </aside>
  )
}
