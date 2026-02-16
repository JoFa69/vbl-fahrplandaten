import { Bus, Route, Gauge, AlertTriangle } from "lucide-react"
import { NavRail } from "@/components/nav-rail"
import { FilterSidebar } from "@/components/sidebar"
import { AiSearchBar } from "@/components/ai-search-bar"
import { KpiCard } from "@/components/kpi-card"
import { TransitMap } from "@/components/transit-map"
import { FrequencySpeedChart } from "@/components/charts/frequency-speed-chart"
import { SanityTable } from "@/components/sanity-table"
import { AiFab } from "@/components/ai-fab"
import { kpiData } from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      {/* Primary Icon Rail */}
      <NavRail />

      {/* Contextual Filter Sidebar */}
      <FilterSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-[calc(4rem+250px)] p-6 overflow-y-auto">
        {/* AI Search Bar */}
        <div className="mb-6">
          <AiSearchBar />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <KpiCard
            title="Total Daily Trips"
            value={kpiData.totalDailyTrips}
            subtitle="Tagesfahrten Werktag"
            icon={Bus}
            trend="+3.2%"
          />
          <KpiCard
            title="Revenue Kilometers"
            value={kpiData.revenueKilometers.toLocaleString("de-CH") + " km"}
            subtitle="Nutzwagenkilometer (NWKM)"
            icon={Route}
            trend="+1.8%"
          />
          <KpiCard
            title="Avg Commercial Speed"
            value={`${kpiData.avgCommercialSpeed} km/h`}
            subtitle="Reisegeschwindigkeit"
            icon={Gauge}
            trend="-0.4%"
          />
          <KpiCard
            title="Critical Layovers"
            value={kpiData.criticalLayovers}
            subtitle={"Wendezeiten < 5 Min."}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Map + Chart Row - 70/30 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 mb-6">
          <div className="lg:col-span-7">
            <TransitMap />
          </div>
          <div className="lg:col-span-3">
            <FrequencySpeedChart />
          </div>
        </div>

        {/* Sanity Table */}
        <SanityTable />
      </main>

      {/* Floating AI Button */}
      <AiFab />
    </div>
  )
}
