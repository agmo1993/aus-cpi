/**
 * Category Page
 * Plot and compare CPI by Category
 */

import ChartSelector from "@/components/ui/ChartSelector";
import { getMonthlyCategories } from "@/lib/queries/lookup";
import { getMonthlyTimeSeries } from "@/lib/queries/cpi";
import { NATIONAL_CITY } from "@/lib/queries/cpi";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Category({ searchParams }: CategoryPageProps) {
  const [monthlyCategories, params] = await Promise.all([
    getMonthlyCategories(),
    searchParams,
  ]);

  const itemParam = typeof params.item === "string" ? params.item : null;
  const cityParam = typeof params.city === "string" ? params.city : NATIONAL_CITY;
  const seriesParam = typeof params.s === "string" ? params.s : null;

  const initialCategory =
    (seriesParam
      ? monthlyCategories.find((c) => c.seriesid === seriesParam)
      : null) ??
    (itemParam
      ? monthlyCategories.find(
          (c) => c.item === itemParam && c.city === cityParam
        ) ??
        monthlyCategories.find((c) => c.item === itemParam)
      : null) ??
    monthlyCategories[0] ??
    null;

  const firstData = initialCategory
    ? await getMonthlyTimeSeries(initialCategory.seriesid)
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Plot and compare any published CPI series. Options are labelled
          &lsquo;city - item&rsquo;, so the eight capital cities and the national
          weighted average can be compared against each other. Select up to five
          series; the chart updates as you add or remove them.
        </p>
      </div>

      <ChartSelector
        categories={monthlyCategories}
        firstData={firstData}
        initialCategory={initialCategory}
        dataFrequency="Monthly"
      />
    </div>
  );
}
