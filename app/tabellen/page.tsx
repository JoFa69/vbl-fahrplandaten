"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { dbStats, tableColumns, sampleTableData } from "@/lib/mock-data"

const availableTables = Object.keys(sampleTableData)

export default function TabellenPage() {
  const [selectedTable, setSelectedTable] = useState(availableTables[0])

  const columns = tableColumns[selectedTable] || []
  const rows = sampleTableData[selectedTable] || []
  const tableInfo = dbStats.tables.find((t) => t.name === selectedTable)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Tabellen-Ansicht
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rohdaten der VDV 452 Tabellen durchsuchen
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTables.map((table) => (
          <button
            key={table}
            onClick={() => setSelectedTable(table)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-mono transition-colors",
              selectedTable === table
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-transparent hover:text-foreground"
            )}
          >
            {table}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <code className="text-sm font-mono text-accent">{selectedTable}</code>
            {tableInfo && (
              <span className="text-xs text-muted-foreground">
                {tableInfo.description}
              </span>
            )}
          </div>
          {tableInfo && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {tableInfo.rows.toLocaleString("de-CH")} Zeilen
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:bg-secondary/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-card-foreground whitespace-nowrap font-mono text-xs"
                    >
                      {row[col] !== undefined ? String(row[col]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Zeige {rows.length} von {tableInfo?.rows.toLocaleString("de-CH") ?? "?"} Datensaetzen (Mock-Daten)
          </p>
        </div>
      </div>
    </div>
  )
}
