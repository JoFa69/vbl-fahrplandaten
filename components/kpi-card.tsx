import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  variant?: "default" | "warning"
}

export function KpiCard({ title, value, subtitle, icon: Icon, variant = "default" }: KpiCardProps) {
  const isWarning = variant === "warning"

  return (
    <div className={cn(
      "rounded-xl border p-5 transition-shadow hover:shadow-md",
      isWarning
        ? "bg-card border-warning/30 ring-1 ring-warning/10"
        : "bg-card border-border"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-[11px] font-medium uppercase tracking-wider",
            isWarning ? "text-warning" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            isWarning ? "text-warning" : "text-card-foreground"
          )}>
            {typeof value === "number" ? value.toLocaleString("de-CH") : value}
          </p>
        </div>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          isWarning ? "bg-warning/10" : "bg-primary/8"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isWarning ? "text-warning" : "text-primary"
          )} />
        </div>
      </div>
      <p className={cn(
        "text-xs mt-2",
        isWarning ? "text-warning/70" : "text-muted-foreground"
      )}>
        {subtitle}
      </p>
    </div>
  )
}
