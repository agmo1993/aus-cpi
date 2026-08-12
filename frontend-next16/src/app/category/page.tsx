/**
 * Category Page
 * Plot and compare CPI by Category
 */

import { Card, CardContent } from "@/components/ui/card";
import ChartSelector from "@/components/ui/ChartSelector";
import { getMonthlyCategories } from "@/lib/queries/lookup";
import { getMonthlyTimeSeries } from "@/lib/queries/cpi";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Category() {
  // Every series across all nine locations. ChartSelector labels each option
  // '<city> - <item>', so the eight capital cities and the national weighted
  // average stay distinguishable in the list.
  const monthlyCategories = await getMonthlyCategories();

  // Fetch first category's data
  const firstData = monthlyCategories.length > 0
    ? await getMonthlyTimeSeries(monthlyCategories[0].seriesid)
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Plot and compare any published CPI series. Options are labelled
          &lsquo;city - item&rsquo;, so the eight capital cities and the national
          weighted average can be compared against each other.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ChartSelector
            categories={monthlyCategories}
            firstData={firstData}
            title="CPI by Category"
            dataFrequency="Monthly"
          />
        </CardContent>
      </Card>
    </div>
  );
}
