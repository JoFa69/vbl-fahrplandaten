import { Database, Table2, HardDrive, Clock } from "lucide-react"
import { KpiCard } from "@/components/kpi-card"
import { DbTableList } from "@/components/db-table-list"
import { dbStats } from "@/lib/mock-data"

export default function OverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Uebersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zusammenfassung der importierten VDV 452 Fahrplandaten
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tabellen"
          value={dbStats.totalTables}
          subtitle="VDV 452 Datentabellen"
          icon={Table2}
        />
        <KpiCard
          title="Datensaetze"
          value={dbStats.totalRows}
          subtitle="Gesamtanzahl Zeilen"
          icon={Database}
        />
        <KpiCard
          title="Datenbankgroesse"
          value={dbStats.dbSize}
          subtitle="PostgreSQL"
          icon={HardDrive}
        />
        <KpiCard
          title="Letzter Import"
          value={new Date(dbStats.lastImport).toLocaleDateString("de-CH")}
          subtitle={new Date(dbStats.lastImport).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
          icon={Clock}
        />
      </div>

      <DbTableList />
    </div>
  )
}
