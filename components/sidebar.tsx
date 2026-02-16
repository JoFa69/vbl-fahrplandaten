"use client"

import { useState, useCallback } from "react"
import {
  Calendar,
  Sun,
  Sunrise,
  CloudSun,
  Clock,
  ChevronDown,
  Check,
  SlidersHorizontal,
  Route,
} from "lucide-react"
import { allLines } from "@/lib/mock-data"

const dayTypes = [
  { id: "weekday", label: "Werktag", icon: Sunrise },
  { id: "saturday", label: "Samstag", icon: CloudSun },
  { id: "sunday", label: "Sonntag", icon: Sun },
]

export function FilterSidebar() {
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
    <aside className="fixed left-16 top-0 bottom-0 w-[250px] bg-sidebar border-r border-sidebar-border flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <SlidersHorizontal className="w-4 h-4 text-sidebar-active" />
        <div>
          <h2 className="text-[13px] font-semibold text-sidebar-foreground">Dashboard Filter</h2>
          <p className="text-[10px] text-muted-foreground leading-tight">Netzwerk-Ansicht</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Date Range */}
        <section>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
            <Calendar className="w-3 h-3" />
            Zeitraum
          </label>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-muted-foreground">Von</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-sidebar-muted text-foreground text-xs rounded-lg px-3 py-2 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-active mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Bis</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-sidebar-muted text-foreground text-xs rounded-lg px-3 py-2 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-active mt-0.5"
              />
            </div>
          </div>
        </section>

        {/* Day Type */}
        <section>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
            <Sun className="w-3 h-3" />
            Tagesart
          </label>
          <div className="space-y-1">
            {dayTypes.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`w-full flex items-center gap-2 px-3 py-[7px] rounded-lg text-xs transition-colors ${
                  selectedDays.includes(day.id)
                    ? "bg-primary/8 text-sidebar-active font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-muted"
                }`}
              >
                <div className={`w-[15px] h-[15px] rounded border-[1.5px] flex items-center justify-center transition-all ${
                  selectedDays.includes(day.id)
                    ? "bg-sidebar-active border-sidebar-active"
                    : "border-muted-foreground/30"
                }`}>
                  {selectedDays.includes(day.id) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <day.icon className="w-3.5 h-3.5" />
                {day.label}
              </button>
            ))}
          </div>
        </section>

        {/* Lines Multi-select */}
        <section>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
            <Route className="w-3 h-3" />
            Linien
          </label>
          <div className="relative">
            <button
              onClick={() => setLinesOpen(!linesOpen)}
              className="w-full flex items-center justify-between bg-sidebar-muted text-foreground text-xs rounded-lg px-3 py-2 border border-sidebar-border hover:border-muted-foreground/40 transition-colors"
            >
              <span className="truncate">
                {selectedLines.length === 0
                  ? "Linien waehlen..."
                  : `${selectedLines.length} Linien`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${linesOpen ? "rotate-180" : ""}`} />
            </button>
            {linesOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                {allLines.map(line => (
                  <button
                    key={line}
                    onClick={() => toggleLine(line)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-foreground"
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex items-center justify-center shrink-0 ${
                      selectedLines.includes(line)
                        ? "bg-sidebar-active border-sidebar-active"
                        : "border-muted-foreground/30"
                    }`}>
                      {selectedLines.includes(line) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span>{line}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedLines.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedLines.map(l => (
                <span key={l} className="text-[10px] bg-primary/8 text-sidebar-active px-2 py-0.5 rounded-full font-medium">
                  {l.replace("Linie ", "L")}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Time Window Slider */}
        <section>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
            <Clock className="w-3 h-3" />
            Zeitfenster
          </label>
          <div className="flex items-center justify-between text-xs text-foreground mb-3">
            <span className="font-mono text-[11px] bg-sidebar-muted border border-sidebar-border px-2 py-0.5 rounded-md">{String(timeStart).padStart(2, "0")}:00</span>
            <div className="h-px flex-1 mx-2 bg-border" />
            <span className="font-mono text-[11px] bg-sidebar-muted border border-sidebar-border px-2 py-0.5 rounded-md">{String(timeEnd).padStart(2, "0")}:00</span>
          </div>
          <div className="space-y-2.5">
            <input
              type="range"
              min={0}
              max={24}
              value={timeStart}
              onChange={e => {
                const v = Number(e.target.value)
                if (v < timeEnd) setTimeStart(v)
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-accent"
            />
            <input
              type="range"
              min={0}
              max={24}
              value={timeEnd}
              onChange={e => {
                const v = Number(e.target.value)
                if (v > timeStart) setTimeEnd(v)
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-accent"
            />
          </div>
          {/* Hour marks */}
          <div className="flex justify-between mt-1 px-0.5">
            {[0, 6, 12, 18, 24].map(h => (
              <span key={h} className="text-[9px] text-muted-foreground font-mono">{h}</span>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-sidebar-border bg-sidebar-muted">
        <button className="w-full text-[11px] font-medium text-sidebar-active hover:underline">
          Filter zuruecksetzen
        </button>
      </div>
    </aside>
  )
}
