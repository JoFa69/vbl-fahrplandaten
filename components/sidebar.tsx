"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Table2,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Uebersicht", icon: LayoutDashboard },
  { href: "/ki-abfrage", label: "KI-Abfrage", icon: MessageSquare },
  { href: "/analysen", label: "Analysen", icon: BarChart3 },
  { href: "/tabellen", label: "Tabellen", icon: Table2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Database className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground tracking-tight">
          VBL Fahrplandaten
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-chart-green" />
          <span className="text-xs text-muted-foreground">
            Datenbank verbunden
          </span>
        </div>
      </div>
    </aside>
  )
}
