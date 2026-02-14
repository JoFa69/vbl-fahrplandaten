import { dbStats } from "@/lib/mock-data"

export function DbTableList() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-5 py-3">
        <h3 className="text-sm font-medium text-card-foreground">
          Datenbank-Tabellen
        </h3>
      </div>
      <div className="divide-y divide-border">
        {dbStats.tables.map((table) => (
          <div
            key={table.name}
            className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-accent">
                {table.name}
              </code>
              <span className="text-sm text-muted-foreground">
                {table.description}
              </span>
            </div>
            <span className="text-sm tabular-nums text-card-foreground">
              {table.rows.toLocaleString("de-CH")} Zeilen
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
