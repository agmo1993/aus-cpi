"use client";

/**
 * TrendChart
 * The headline CPI series with a working time-range selector.
 *
 * A client island purely so the range buttons have somewhere to keep state.
 * The series itself is fetched on the server and passed down.
 */

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PeriodPills, periodPillClass } from "@/components/ui/period-pills";
import { LineChart } from "@/components/charts";
import { formatMonth } from "@/lib/format";

/** Monthly data, so a range is just a count of trailing points. */
const RANGES = [
  { id: "1y", label: "1Y", months: 12 },
  { id: "5y", label: "5Y", months: 60 },
  { id: "all", label: "All", months: null },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

interface TrendChartProps {
  data: { date: string; cpi: string }[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [range, setRange] = useState<RangeId>("5y");

  const visible = useMemo(() => {
    const months = RANGES.find((r) => r.id === range)?.months;
    return months ? data.slice(-months) : data;
  }, [data, range]);

  const from = formatMonth(visible[0]?.date);
  const to = formatMonth(visible[visible.length - 1]?.date);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Historical trend</CardTitle>
            <CardDescription>
              All groups CPI, weighted average of eight capital cities
              {from && to ? `, ${from} to ${to}` : ""}
            </CardDescription>
          </div>

          <PeriodPills aria-label="Time range">
            {RANGES.map((option) => {
              const isActive = option.id === range;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRange(option.id)}
                  aria-pressed={isActive}
                  className={periodPillClass(isActive)}
                >
                  {option.label}
                </button>
              );
            })}
          </PeriodPills>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No data for this range.
          </p>
        ) : (
          <LineChart
            data={visible}
            xaxis="date"
            yaxis="cpi"
            chartTitle={null}
            height={360}
            marginTop={10}
            className="border-0 shadow-none bg-transparent"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
