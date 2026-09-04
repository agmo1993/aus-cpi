"use client";

/**
 * MultiLineChart
 * Multi-series time series chart using Recharts (same stack as BasketChart).
 */

import React, { useMemo } from "react";
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
import { MAX_SERIES } from "@/lib/colors";
import { alignOnUnion, type SeriesRow } from "@/lib/timeseries";
import type { MultiLineChartProps } from "@/types";

const SERIES_STROKES = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  xaxis,
  yaxis,
  chartTitle = null,
  height = 500,
  marginTop = 20,
  className = "",
  seriesNames,
}) => {
  const { chartData, names } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [] as Record<string, string | number | null>[], names: [] as string[] };
    }

    const capped = data.slice(0, MAX_SERIES) as unknown as SeriesRow[][];
    const { months, values } = alignOnUnion(capped, xaxis, yaxis);

    const labels = capped.map(
      (seriesData, index) =>
        seriesNames?.[index] ||
        String(seriesData[0]?.item || `Series ${index + 1}`)
    );

    const rows = months.map((month, monthIndex) => {
      const row: Record<string, string | number | null> = { month };
      labels.forEach((label, seriesIndex) => {
        row[label] = values[seriesIndex][monthIndex];
      });
      return row;
    });

    return { chartData: rows, names: labels };
  }, [data, xaxis, yaxis, seriesNames]);

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: `${height}px` }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const formatValue = (value: number) =>
    Number.isFinite(value) ? value.toFixed(1) : "n/a";

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      {chartTitle && (
        <p className="mb-2 text-sm font-medium text-foreground">{chartTitle}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: marginTop, right: 16, left: 8, bottom: 4 }}
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
              value: "Index",
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
              formatValue(value),
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
              stroke={SERIES_STROKES[index]}
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
  );
};

export default MultiLineChart;
