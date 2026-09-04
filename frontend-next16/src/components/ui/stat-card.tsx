/**
 * Stat Card Component
 * Metric display with an icon, a value, and an optional trend indicator.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: string
    label: string
    direction: "up" | "down" | "neutral"
  }
  iconColor?: string
  iconBgColor?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon: Icon, trend, iconColor, iconBgColor, ...props }, ref) => {
    // Prices rising is the unwelcome direction for a cost-of-living figure, so
    // up reads as danger here and down as success. CategoryCard follows the same rule.
    const trendColor = !trend
      ? ""
      : trend.direction === "up"
        ? "text-danger"
        : trend.direction === "down"
          ? "text-success"
          : "text-muted-foreground"

    const TrendIcon = !trend
      ? null
      : trend.direction === "up"
        ? TrendingUp
        : trend.direction === "down"
          ? TrendingDown
          : Minus

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border bg-card p-6 text-card-foreground",
          className
        )}
        {...props}
      >
        <div className="space-y-3">
          {/* Header with title and icon */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            {Icon && (
              <div className={cn("p-2 rounded-lg", iconBgColor || "bg-primary/10")} aria-hidden="true">
                <Icon
                  className={cn("h-5 w-5", iconColor || "text-primary")}
                  strokeWidth={1.75}
                />
              </div>
            )}
          </div>

          {/* Value */}
          <div className="text-4xl font-semibold tracking-tight tabular-nums">
            {value}
          </div>

          {/* Trend indicator */}
          {trend && TrendIcon && (
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", trendColor)}>
                <TrendIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {trend.value}
              </span>
              <span className="text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
