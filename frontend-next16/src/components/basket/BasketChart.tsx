"use client";

/**
 * Your basket against the published CPI, over the current link period.
 *
 * Two views of the same pair of series: the index levels, which share a scale
 * because the rebuilt index is anchored to the published one at the link, and
 * the cumulative change since the link, which is the same picture with the
 * common starting point divided out. The second is the one that answers 'is
 * my cost of living rising faster than the headline', so it leads.
 */

import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBasketMonth } from "@/lib/basket";

export type ChartMode = "change" | "level";

interface BasketChartProps {
  months: string[];
  basket: number[];
  headline: number[];
  mode: ChartMode;
  /** Shown in the tooltip and the legend, e.g. 'Sydney'. */
  city: string;
}

const YOURS = "hsl(var(--chart-1))";
const PUBLISHED = "hsl(var(--chart-4))";

const BasketChart: React.FC<BasketChartProps> = ({
  months,
  basket,
  headline,
  mode,
  city,
}) => {
  const data = months.map((month, t) => ({
    month: formatBasketMonth(month),
    yours:
      mode === "level" ? basket[t] : (basket[t] / basket[0] - 1) * 100,
    published:
      mode === "level" ? headline[t] : (headline[t] / headline[0] - 1) * 100,
  }));

  const format = (value: number) =>
    `${value.toFixed(2)}${mode === "level" ? "" : "%"}`;

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            className="text-xs"
          />
          {/*
            Fitted to the data, not zero-based: an index sits near 100 and
            moves by a point or two, so a zero baseline flattens both series
            into one line. The cumulative view keeps zero, where it is the
            link period and means something.
          */}
          <YAxis
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => format(value)}
            className="text-xs"
          />
          {mode === "change" && (
            <ReferenceLine y={0} className="stroke-border" strokeWidth={1} />
          )}
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.8125rem",
              color: "hsl(var(--popover-foreground))",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value: number, name: string) => [format(value), name]}
          />
          <Legend
            verticalAlign="top"
            align="left"
            height={32}
            iconType="plainline"
            wrapperStyle={{ fontSize: "0.8125rem" }}
          />
          {/*
            Animation off, as elsewhere on the site: Recharts draws a line in
            by animating stroke-dasharray from zero, so the chart is blank
            until the animation runs — for print, screenshots, and anyone with
            reduced motion, permanently.
          */}
          <Line
            name="Your basket"
            type="monotone"
            dataKey="yours"
            stroke={YOURS}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Line
            name={`Published CPI, ${city}`}
            type="monotone"
            dataKey="published"
            stroke={PUBLISHED}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BasketChart;
