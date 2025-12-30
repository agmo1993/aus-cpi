/**
 * City Page
 * Plot and compare CPI by Category and City
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartSelector from "@/components/ui/ChartSelector";
import { getQuarterlyCategories } from "@/lib/queries/lookup";
import { getQuarterlyTimeSeries } from "@/lib/queries/cpi";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function City() {
  // Fetch quarterly categories
  const quarterlyCategories = await getQuarterlyCategories();

  // Fetch first category's data
  const firstData = quarterlyCategories.length > 0
    ? await getQuarterlyTimeSeries(quarterlyCategories[0].seriesid)
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-center text-xl font-bold">
            Plot and compare CPI by Category and City
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ChartSelector
            categories={quarterlyCategories}
            firstData={firstData}
            title="CPI by City"
            dataFrequency="Quarterly"
          />
        </CardContent>
      </Card>
    </div>
  );
}
