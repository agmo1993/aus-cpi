"use client";

/**
 * OECD multi-country YoY chart with country selection checkboxes.
 * Uses chat-style Recharts strokes so more than MAX_SERIES=5 lines can show.
 */

import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { alignOnUnion, type SeriesRow } from "@/lib/timeseries";
import type { OecdCountry, OecdYoySeries } from "@/lib/queries/oecd";
import { cn } from "@/lib/utils";

const CHART_STROKES = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(200 45% 45%)",
  "hsl(320 40% 50%)",
  "hsl(25 55% 48%)",
  "hsl(170 40% 38%)",
  "hsl(250 35% 55%)",
  "hsl(80 40% 40%)",
  "hsl(0 0% 45%)",
] as const;

const MAX_VISIBLE = 12;

export interface OecdCompareChartProps {
  countries: OecdCountry[];
  series: OecdYoySeries[];
  defaultCodes: string[];
  height?: number;
}

export default function OecdCompareChart({
  countries,
  series,
  defaultCodes,
  height = 360,
}: OecdCompareChartProps) {
  const availableCodes = useMemo(
    () => new Set(series.map((s) => s.country_code)),
    [series]
  );

  const initial = useMemo(() => {
    const defaults = defaultCodes.filter((c) => availableCodes.has(c));
    return new Set(defaults.length ? defaults : [...availableCodes].slice(0, 5));
  }, [defaultCodes, availableCodes]);

  const [selected, setSelected] = useState<Set<string>>(initial);

  const selectedSeries = useMemo(
    () =>
      series
        .filter((s) => selected.has(s.country_code))
        .slice(0, MAX_VISIBLE),
    [series, selected]
  );

  const { chartData, names } = useMemo(() => {
    if (!selectedSeries.length) {
      return {
        chartData: [] as Record<string, string | number | null>[],
        names: [] as string[],
      };
    }

    const pointArrays = selectedSeries.map((s) =>
      s.points.map((p) => ({
        publish_date: p.date,
        cpi_value: p.value,
        item: s.country_name,
      }))
    ) as unknown as SeriesRow[][];

    const { months, values } = alignOnUnion(
      pointArrays,
      "publish_date",
      "cpi_value"
    );
    const labels = selectedSeries.map((s) => s.country_name);
    const rows = months.map((month, monthIndex) => {
      const row: Record<string, string | number | null> = { month };
      labels.forEach((label, seriesIndex) => {
        row[label] = values[seriesIndex][monthIndex];
      });
      return row;
    });
    return { chartData: rows, names: labels };
  }, [selectedSeries]);

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size <= 1) return prev;
        next.delete(code);
      } else {
        if (next.size >= MAX_VISIBLE) return prev;
        next.add(code);
      }
      return next;
    });
  }

  const formatValue = (value: number) =>
    Number.isFinite(value) ? value.toFixed(1) : "n/a";

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Countries on chart
        </legend>
        <div className="flex flex-wrap gap-2">
          {countries
            .filter((c) => availableCodes.has(c.country_code))
            .map((c) => {
              const on = selected.has(c.country_code);
              return (
                <label
                  key={c.country_code}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    on
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent/60"
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => toggle(c.country_code)}
                  />
                  <span className="font-medium">{c.country_code}</span>
                  <span className="hidden sm:inline">{c.country_name}</span>
                </label>
              );
            })}
        </div>
      </fieldset>

      {!chartData.length ? (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No data available
        </div>
      ) : (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                className="text-xs"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value: number) => formatValue(value)}
                className="text-xs"
                label={{
                  value: "YoY %",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => [
                  `${formatValue(value)}%`,
                  name,
                ]}
              />
              {names.length > 1 && (
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="plainline"
                  wrapperStyle={{ fontSize: "0.8125rem", paddingTop: 8 }}
                />
              )}
              {names.map((name, index) => (
                <Line
                  key={name}
                  name={name}
                  type="monotone"
                  dataKey={name}
                  stroke={CHART_STROKES[index % CHART_STROKES.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
