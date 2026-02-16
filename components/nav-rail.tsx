"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Map,
  Database,
  Settings,
  Bus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Karte", icon: Map },
  { id: "data", label: "Daten", icon: Database },
  { id: "settings", label: "Einstellungen", icon: Settings },
]

export function NavRail() {
  const [active, setActive] = useState("dashboard")

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-16 bg-rail flex flex-col items-center z-30" aria-label="Primary Navigation">
      {/* Logo */}
      <div className="flex items-center justify-center w-full h-16 border-b border-rail-hover">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-rail-active/20">
          <Bus className="w-5 h-5 text-rail-active" />
        </div>
      </div>

      {/* Module Icons */}
      <div className="flex-1 flex flex-col items-center gap-1 pt-4 px-2 w-full">
        {modules.map(mod => {
          const isActive = mod.id === active
          return (
            <button
              key={mod.id}
              onClick={() => setActive(mod.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-150",
                isActive
                  ? "bg-rail-active/15 text-rail-active"
                  : "text-rail-foreground hover:bg-rail-hover hover:text-white"
              )}
              aria-label={mod.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-rail-active" />
              )}
              <mod.icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-medium leading-tight">{mod.label}</span>
            </button>
          )
        })}
      </div>

      {/* Version pill */}
      <div className="pb-4 px-2">
        <span className="text-[8px] text-rail-foreground/40 font-mono">v2.0</span>
      </div>
    </nav>
  )
}
