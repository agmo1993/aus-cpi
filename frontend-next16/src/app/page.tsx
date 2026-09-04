/**
 * Home Page - Inflation Monitor
 * Headline CPI metrics, the historical series, major groups, and top movers.
 */

import Link from "next/link";
import { StatCard, CategoryCard, type CategoryAccent } from "@/components/ui";
import { TopMoversGrid, TrendChart } from "@/components/data";
import {
  getMainCPISeries,
  getTopMonthlyIncreases,
  getTopYearlyIncreases,
  getAnnualChangeByItem,
  NATIONAL_CITY,
} from "@/lib/queries";
import { formatMonth, formatPct } from "@/lib/format";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Hash,
  Zap,
  Home as HomeIcon,
  ShoppingCart,
} from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Major groups surfaced as cards, named as the ABS publishes them. The accent
// keys index the categorical series, so a group keeps its colour on a chart.
const MAJOR_GROUPS: {
  item: string;
  title: string;
  subtitle: string;
  icon: typeof Zap;
  accent: CategoryAccent;
}[] = [
  { item: "Electricity", title: "Electricity", subtitle: "Utilities", icon: Zap, accent: 5 },
  { item: "Food and non-alcoholic beverages", title: "Food and drink", subtitle: "Essentials", icon: ShoppingCart, accent: 3 },
  { item: "Housing", title: "Housing", subtitle: "Construction and rents", icon: HomeIcon, accent: 4 },
];

export default async function Home() {
  // Fetch data in parallel
  const [mainSeries, monthlyMovers, yearlyMovers, majorGroups] = await Promise.all([
    getMainCPISeries(),
    getTopMonthlyIncreases(5),
    getTopYearlyIncreases(5),
    getAnnualChangeByItem(MAJOR_GROUPS.map((group) => group.item)),
  ]);

  // Transform data for the chart
  const chartData = mainSeries.map((item) => ({
    date: item.date,
    cpi: item.cpi,
  }));

  // Get latest CPI values for stats
  const latestCPI = mainSeries[mainSeries.length - 1] || { cpi: '0' };
  const previousCPI = mainSeries[mainSeries.length - 2] || { cpi: '0' };
  const quarterAgo = mainSeries[mainSeries.length - 4] || { cpi: '0' };
  const priorQuarterAgo = mainSeries[mainSeries.length - 7] || { cpi: '0' };
  const yearAgo = mainSeries[mainSeries.length - 13] || { cpi: '0' };

  const latestVal = parseFloat(latestCPI.cpi);
  const prevVal = parseFloat(previousCPI.cpi);
  const quarterVal = parseFloat(quarterAgo.cpi);
  const priorQuarterVal = parseFloat(priorQuarterAgo.cpi);
  const yearVal = parseFloat(yearAgo.cpi);

  const monthlyChange = prevVal ? ((latestVal - prevVal) / prevVal * 100).toFixed(1) : '0.0';
  const quarterlyChange = quarterVal ? ((latestVal - quarterVal) / quarterVal * 100).toFixed(1) : '0.0';
  const priorQuarterlyChange = priorQuarterVal && quarterVal
    ? ((quarterVal - priorQuarterVal) / priorQuarterVal) * 100
    : 0;
  const quarterlyDelta = parseFloat(quarterlyChange) - priorQuarterlyChange;
  const annualChange = yearVal ? ((latestVal - yearVal) / yearVal * 100).toFixed(1) : '0.0';

  // The annual change a month earlier, to say which way the headline is moving.
  const priorLatest = parseFloat(mainSeries[mainSeries.length - 2]?.cpi ?? '0');
  const priorYearAgo = parseFloat(mainSeries[mainSeries.length - 14]?.cpi ?? '0');
  const priorAnnualChange = priorYearAgo
    ? ((priorLatest - priorYearAgo) / priorYearAgo) * 100
    : 0;
  const annualDelta = parseFloat(annualChange) - priorAnnualChange;

  const latestMonth = formatMonth(mainSeries[mainSeries.length - 1]?.date);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Inflation Monitor</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Consumer price movements for the weighted average of eight capital
          cities{latestMonth ? `, to ${latestMonth}` : ""}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Annual CPI"
          value={`${annualChange}%`}
          icon={TrendingUp}
          iconColor="text-chart-1"
          iconBgColor="bg-chart-1/10"
          trend={{
            value: `${Math.abs(annualDelta).toFixed(1)}pp`,
            label: "vs last month",
            direction: annualDelta > 0 ? "up" : annualDelta < 0 ? "down" : "neutral"
          }}
        />

        <StatCard
          title="Quarterly"
          value={`${quarterlyChange}%`}
          icon={BarChart3}
          iconColor="text-chart-4"
          iconBgColor="bg-chart-4/10"
          trend={{
            value: `${Math.abs(quarterlyDelta).toFixed(1)}pp`,
            label: "vs prior quarter",
            direction: quarterlyDelta > 0 ? "up" : quarterlyDelta < 0 ? "down" : "neutral"
          }}
        />

        <StatCard
          title="Monthly"
          value={`${monthlyChange}%`}
          icon={Activity}
          iconColor="text-chart-2"
          iconBgColor="bg-chart-2/10"
          trend={{
            value: latestMonth,
            label: "latest",
            direction: "neutral"
          }}
        />

        <StatCard
          title="Index value"
          value={latestVal ? latestVal.toFixed(1) : "n/a"}
          icon={Hash}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
      </div>

      {/* Historical Trend Chart */}
      <TrendChart data={chartData} />

      {/* Major Groups Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Major groups</h2>
            <p className="text-sm text-muted-foreground mt-1">Annual percentage change by category</p>
          </div>
          <Link
            href={`/category?item=${encodeURIComponent("All groups CPI")}&city=${encodeURIComponent(NATIONAL_CITY)}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Compare all categories
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MAJOR_GROUPS.map((group) => {
            const change = majorGroups.get(group.item);
            const pct = change ? parseFloat(change.pct_change) : null;

            return (
              <CategoryCard
                key={group.item}
                href={`/category?item=${encodeURIComponent(group.item)}&city=${encodeURIComponent(NATIONAL_CITY)}`}
                title={group.title}
                subtitle={group.subtitle}
                value={pct === null ? "n/a" : formatPct(pct)}
                icon={group.icon}
                accent={group.accent}
                trend={pct === null ? "neutral" : pct > 0 ? "up" : pct < 0 ? "down" : "neutral"}
              />
            );
          })}
        </div>
      </div>

      {/* Top Movers Grid */}
      <TopMoversGrid
        monthlyData={monthlyMovers}
        yearlyData={yearlyMovers}
      />
    </div>
  );
}
