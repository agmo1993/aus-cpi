/**
 * Category Card Component
 * Card with a colored accent bar for category display.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

/**
 * Accent classes are written out in full rather than assembled at runtime.
 * Tailwind only emits classes it can find as literal strings in the source, so
 * a class built by concatenation (`"bg-" + colour`) is scanned as absent and
 * purged from the stylesheet.
 *
 * Keys map to the categorical chart series, so a category's card carries the
 * same colour as its line on a chart.
 */
const ACCENTS = {
  1: { bar: "bg-chart-1", tile: "bg-chart-1/10", icon: "text-chart-1" },
  2: { bar: "bg-chart-2", tile: "bg-chart-2/10", icon: "text-chart-2" },
  3: { bar: "bg-chart-3", tile: "bg-chart-3/10", icon: "text-chart-3" },
  4: { bar: "bg-chart-4", tile: "bg-chart-4/10", icon: "text-chart-4" },
  5: { bar: "bg-chart-5", tile: "bg-chart-5/10", icon: "text-chart-5" },
} as const

export type CategoryAccent = keyof typeof ACCENTS

interface CategoryCardProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
  value: string
  icon?: LucideIcon
  accent?: CategoryAccent
  trend?: "up" | "down" | "neutral"
  /** When set, the card is a link (e.g. deep-link into /category). */
  href?: string
}

const CategoryCard = React.forwardRef<HTMLElement, CategoryCardProps>(
  ({ className, title, subtitle, value, icon: Icon, accent = 1, trend, href, ...props }, ref) => {
    const accentClasses = ACCENTS[accent]

    // Prices rising is the unwelcome direction for a cost-of-living figure, so
    // up reads as danger here and down as success. StatCard follows the same rule.
    const trendColor =
      trend === "up" ? "text-danger" : trend === "down" ? "text-success" : "text-muted-foreground"

    const body = (
      <>
        {/* Colored accent bar at bottom */}
        <div className={cn("absolute bottom-0 left-0 right-0 h-1", accentClasses.bar)} aria-hidden="true" />

        {/* Content */}
        <div className="flex items-center justify-between gap-3">
          {Icon && (
            <div className={cn("p-2.5 rounded-lg", accentClasses.tile)} aria-hidden="true">
              <Icon className={cn("h-5 w-5", accentClasses.icon)} strokeWidth={1.75} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div className={cn("text-lg font-semibold tabular-nums", trendColor)}>
            {trend === "up" && "+"}
            {value}
          </div>
        </div>
      </>
    )

    const classes = cn(
      "relative rounded-xl border bg-card p-4 text-card-foreground overflow-hidden transition-colors hover:border-foreground/20",
      href && "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {body}
        </Link>
      )
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {body}
      </div>
    )
  }
)
CategoryCard.displayName = "CategoryCard"

export { CategoryCard }
