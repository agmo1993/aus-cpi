import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Shared selected-period / segmented control pill styles used on home
 * TrendChart and the basket period selector.
 */
export function periodPillClass(active: boolean, className?: string) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
    className
  )
}

interface PeriodPillsProps {
  "aria-label": string
  className?: string
  children: React.ReactNode
}

export function PeriodPills({
  "aria-label": ariaLabel,
  className,
  children,
}: PeriodPillsProps) {
  return (
    <div
      className={cn("flex flex-wrap rounded-lg border p-0.5", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}
