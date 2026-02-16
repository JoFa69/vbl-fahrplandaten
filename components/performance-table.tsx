"use client"

import { useState, useMemo } from "react"
import { Search, ArrowUpDown } from "lucide-react"
import { linePerformanceData } from "@/lib/mock-data"

type SortKey = "lineId" | "direction" | "totalTrips" | "maxLoad" | "minLoad" | "avgTravelTime"

export function PerformanceTable() {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("lineId")
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const filtered = useMemo(() => {
    let data = linePerformanceData
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        row =>
          row.lineId.toLowerCase().includes(q) ||
          row.direction.toLowerCase().includes(q)
      )
    }
    data = [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
    return data
  }, [search, sortKey, sortAsc])

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "lineId", label: "Linie" },
    { key: "direction", label: "Richtung" },
    { key: "totalTrips", label: "Fahrten", align: "right" },
    { key: "maxLoad", label: "Max. Belastung", align: "right" },
    { key: "minLoad", label: "Min. Belastung", align: "right" },
    { key: "avgTravelTime", label: "Fahrzeit", align: "right" },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Line Performance Metrics
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Leistungskennzahlen pro Linie und Richtung
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suche nach Linie oder Richtung..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? "text-primary" : "text-muted-foreground/40"}`} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row.lineId}-${row.direction}`}
                className={`border-b border-border/50 transition-colors hover:bg-muted/50 ${
                  i % 2 === 0 ? "" : "bg-muted/20"
                }`}
              >
                <td className="py-2.5 px-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/8 text-primary font-bold text-xs">
                    {row.lineId}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-card-foreground">{row.direction}</td>
                <td className="py-2.5 px-4 text-right font-mono text-card-foreground">{row.totalTrips}</td>
                <td className="py-2.5 px-4 text-right font-mono text-card-foreground">{row.maxLoad}</td>
                <td className="py-2.5 px-4 text-right font-mono text-card-foreground">{row.minLoad}</td>
                <td className="py-2.5 px-4 text-right font-mono text-card-foreground">{row.avgTravelTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} von {linePerformanceData.length} Eintraegen
        </p>
      </div>
    </div>
  )
}
