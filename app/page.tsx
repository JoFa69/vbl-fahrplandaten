import { Bus, Route, Gauge, AlertTriangle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { KpiCard } from "@/components/kpi-card"
import { FrequencySpeedChart } from "@/components/charts/frequency-speed-chart"
import { RouteComplexityChart } from "@/components/charts/route-complexity-chart"
import { PerformanceTable } from "@/components/performance-table"
import { kpiData } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground tracking-tight text-balance">
            Transit Network Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Betriebskennzahlen und Netzwerkanalyse - VBL Luzern
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <KpiCard
            title="Tagesfahrten"
            value={kpiData.totalDailyTrips}
            subtitle="Total Daily Trips"
            icon={Bus}
          />
          <KpiCard
            title="Nutzwagenkilometer"
            value={kpiData.revenueKilometers.toLocaleString("de-CH")}
            subtitle="Revenue Kilometers (NWKM)"
            icon={Route}
          />
          <KpiCard
            title="Reisegeschwindigkeit"
            value={`${kpiData.avgCommercialSpeed} km/h`}
            subtitle="Avg Commercial Speed"
            icon={Gauge}
          />
          <KpiCard
            title="Kritische Wendezeiten"
            value={kpiData.criticalLayovers}
            subtitle={"< 5 Min. Wendezeit"}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Charts Row - 60/40 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 mb-6">
          <div className="lg:col-span-3">
            <FrequencySpeedChart />
          </div>
          <div className="lg:col-span-2">
            <RouteComplexityChart />
          </div>
        </div>

        {/* Table Row */}
        <PerformanceTable />
      </main>
    </div>
  )
}
