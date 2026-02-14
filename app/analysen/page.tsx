"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { VolumeChart } from "@/components/charts/volume-chart"
import { TimeChart } from "@/components/charts/time-chart"
import { InfraChart } from "@/components/charts/infra-chart"

const tabs = [
  { id: "volumen", label: "Volumen" },
  { id: "zeit", label: "Zeitverteilung" },
  { id: "infra", label: "Infrastruktur" },
] as const

type TabId = (typeof tabs)[number]["id"]

export default function AnalysenPage() {
  const [activeTab, setActiveTab] = useState<TabId>("volumen")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Analysen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visuelle Auswertung der Fahrplandaten
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-5">
        {activeTab === "volumen" && <VolumeChart />}
        {activeTab === "zeit" && <TimeChart />}
        {activeTab === "infra" && <InfraChart />}
      </div>
    </div>
  )
}
