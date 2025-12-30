/**
 * Category Page
 * Plot and compare CPI by Category
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartSelector from "@/components/ui/ChartSelector";
import { getMonthlyCategories } from "@/lib/queries/lookup";
import { getMonthlyTimeSeries } from "@/lib/queries/cpi";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Category() {
  // Fetch monthly categories
  const monthlyCategories = await getMonthlyCategories();

  // Fetch first category's data
  const firstData = monthlyCategories.length > 0
    ? await getMonthlyTimeSeries(monthlyCategories[0].seriesid)
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-center text-xl font-bold">
            Plot and compare CPI by Category
          </CardTitle>
        </CardHeader>
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
