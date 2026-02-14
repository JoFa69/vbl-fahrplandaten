import {
  Database,
  Table2,
  Rows3,
  HardDrive,
  Clock,
} from "lucide-react"
import { KpiCard } from "@/components/kpi-card"
import { DbTableList } from "@/components/db-table-list"
import { dbStats } from "@/lib/mock-data"

export default function OverviewPage() {
  console.log("[v0] OverviewPage rendered")
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Uebersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">
          VDV 452 Fahrplandaten -- Datenbank-Statistiken
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tabellen"
          value={dbStats.totalTables}
          subtitle="VDV 452 Strukturen"
          icon={Table2}
        />
        <KpiCard
          title="Datensaetze"
          value={dbStats.totalRows}
          subtitle="Gesamt ueber alle Tabellen"
          icon={Rows3}
        />
        <KpiCard
          title="Datenbankgroesse"
          value={dbStats.dbSize}
          subtitle="PostgreSQL"
          icon={HardDrive}
        />
        <KpiCard
          title="Letzter Import"
          value="15.12.2025"
          subtitle="14:32 Uhr"
          icon={Clock}
        />
      </div>

      <DbTableList />
    </div>
  )
}
