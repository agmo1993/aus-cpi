/**
 * Home Page
 * Main dashboard with CPI index chart and top movers
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart } from "@/components/charts";
import { TopMoversGrid } from "@/components/data";
import { getMainCPISeries, getTopMonthlyIncreases, getTopYearlyIncreases } from "@/lib/queries";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch data in parallel
  const [mainSeries, monthlyMovers, yearlyMovers] = await Promise.all([
    getMainCPISeries(),
    getTopMonthlyIncreases(5),
    getTopYearlyIncreases(5),
  ]);

  // Transform data for the chart
  const chartData = mainSeries.map((item) => ({
    date: item.date,
    cpi: item.cpi,
  }));

  return (
    <div className="space-y-6">
      {/* Main CPI Chart */}
      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-center text-xl">
            <span className="font-bold">Consumer Price Index</span>
            {" | "}
            <span className="text-base font-normal">Monthly base 2017</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LineChart
            data={chartData}
            xaxis="date"
            yaxis="cpi"
            chartTitle={null}
            height={400}
            marginTop={10}
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>

      {/* Top Movers Grid */}
      <TopMoversGrid
        monthlyData={monthlyMovers}
        yearlyData={yearlyMovers}
      />
    </div>
  );
}
