import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  variant?: "default" | "warning"
  trend?: string
}

export function KpiCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: KpiCardProps) {
  const isWarning = variant === "warning"

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:shadow-md",
      isWarning
        ? "bg-card border-destructive/20 ring-1 ring-destructive/10"
        : "bg-card border-border"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg",
          isWarning ? "bg-destructive/8" : "bg-primary/8"
        )}>
          <Icon className={cn(
            "w-[18px] h-[18px]",
            isWarning ? "text-destructive" : "text-primary"
          )} />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            trend.startsWith("+") ? "bg-chart-emerald/10 text-chart-emerald" : "bg-destructive/10 text-destructive"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className={cn(
        "text-2xl font-bold tracking-tight",
        isWarning ? "text-destructive" : "text-card-foreground"
      )}>
        {typeof value === "number" ? value.toLocaleString("de-CH") : value}
      </p>
      <p className={cn(
        "text-[11px] font-medium mt-0.5",
        isWarning ? "text-destructive/80" : "text-muted-foreground"
      )}>
        {title}
      </p>
      <p className={cn(
        "text-[10px] mt-0.5",
        isWarning ? "text-destructive/60" : "text-muted-foreground/70"
      )}>
        {subtitle}
      </p>
    </div>
  )
}
