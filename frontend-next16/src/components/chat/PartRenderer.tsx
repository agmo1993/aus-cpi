"use client";

/**
 * Generative UI parts rendered under assistant replies (Claude-style artifacts).
 */

import React, { useMemo } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LineChart from "@/components/charts/LineChart";
import { alignOnUnion, type SeriesRow } from "@/lib/timeseries";
import type { AnswerPart } from "@/lib/chat/schema";

/** Chat-local strokes — enough for 8 capitals + Australia (bypasses MAX_SERIES=5). */
const CHAT_STROKES = [
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

function ChatMultiLineChart({
  series,
}: {
  series: Extract<AnswerPart, { type: "timeseries" }>["series"];
}) {
  const { chartData, names } = useMemo(() => {
    const pointArrays = series.map((s) =>
      s.points.map((p) => ({
        publish_date: p.date,
        cpi_value: p.value,
        item: s.label,
      }))
    ) as unknown as SeriesRow[][];

    const { months, values } = alignOnUnion(
      pointArrays,
      "publish_date",
      "cpi_value"
    );
    const labels = series.map((s, i) => s.label || `Series ${i + 1}`);
    const rows = months.map((month, monthIndex) => {
      const row: Record<string, string | number | null> = { month };
      labels.forEach((label, seriesIndex) => {
        row[label] = values[seriesIndex][monthIndex];
      });
      return row;
    });
    return { chartData: rows, names: labels };
  }, [series]);

  if (!chartData.length) {
    return (
      <p className="text-sm text-muted-foreground">No data available</p>
    );
  }

  const formatValue = (value: number) =>
    Number.isFinite(value) ? value.toFixed(1) : "n/a";

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
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
            width={44}
            tickFormatter={(value: number) => formatValue(value)}
            className="text-xs"
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
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="plainline"
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }}
          />
          {names.map((name, index) => (
            <Line
              key={name}
              name={name}
              type="monotone"
              dataKey={name}
              stroke={CHAT_STROKES[index % CHAT_STROKES.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimeseriesPart({
  part,
}: {
  part: Extract<AnswerPart, { type: "timeseries" }>;
}) {
  if (!part.series.length) return null;

  if (part.series.length === 1) {
    const s = part.series[0];
    const data = s.points.map((p) => ({
      publish_date: p.date,
      cpi_value: String(p.value),
      item: s.label,
    }));
    return (
      <div className="space-y-2 rounded-xl border bg-card p-3 shadow-sm">
        <div className="px-1 text-sm font-medium">
          {s.seriesid ? (
            <Link
              href={`/category?s=${encodeURIComponent(s.seriesid)}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {s.label}
            </Link>
          ) : (
            s.label
          )}
        </div>
        <LineChart
          data={data}
          xaxis="publish_date"
          yaxis="cpi_value"
          height={280}
          marginTop={8}
          className="border-0 shadow-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
      <ChatMultiLineChart series={part.series} />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Series</TableHead>
              <TableHead className="text-right">Latest</TableHead>
              <TableHead className="text-right">As of</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {part.series.map((s, i) => {
              const last = s.points[s.points.length - 1];
              return (
                <TableRow key={`${s.seriesid ?? s.label}-${i}`}>
                  <TableCell>
                    {s.seriesid ? (
                      <Link
                        href={`/category?s=${encodeURIComponent(s.seriesid)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {s.label}
                      </Link>
                    ) : (
                      s.label
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {last ? last.value.toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {last?.date ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AnswerParts({ parts }: { parts: AnswerPart[] }) {
  if (!parts.length) return null;
  return (
    <div className="mt-4 space-y-4">
      {parts.map((part, idx) => (
        <PartRenderer key={`${part.type}-${idx}`} part={part} />
      ))}
    </div>
  );
}

export function PartRenderer({ part }: { part: AnswerPart }) {
  switch (part.type) {
    case "stat_cards":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {part.cards.map((card, i) => (
            <div
              key={`${card.title}-${i}`}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {card.title}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">
                {card.value}
              </p>
              {card.trend && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.trend.value} {card.trend.label}
                </p>
              )}
            </div>
          ))}
        </div>
      );

    case "series_list":
      return (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card/60 p-3 shadow-sm">
          {part.items.map((item) => (
            <Button key={item.seriesid} variant="outline" size="sm" asChild>
              <Link href={`/category?s=${encodeURIComponent(item.seriesid)}`}>
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      );

    case "top_movers":
      return (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">
                  {part.period === "yearly" ? "YoY %" : "MoM %"}
                </TableHead>
                <TableHead className="text-right">Index</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {part.rows.map((row) => (
                <TableRow key={row.seriesid}>
                  <TableCell>
                    <Link
                      href={`/category?s=${encodeURIComponent(row.seriesid)}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {row.item}
                    </Link>
                  </TableCell>
                  <TableCell>{row.city}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.pct_change}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.current_value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    case "timeseries":
      return <TimeseriesPart part={part} />;

    case "text":
      return (
        <div className="space-y-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {part.markdown.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {para}
            </p>
          ))}
        </div>
      );

    case "correlation_matrix":
      return (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series A</TableHead>
                <TableHead>Series B</TableHead>
                <TableHead className="text-right">r</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {part.pairs.map((pair, i) => (
                <TableRow key={i}>
                  <TableCell>{pair.itemY}</TableCell>
                  <TableCell>{pair.itemX}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pair.corr.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {part.overlapMonths != null && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              Overlap: {part.overlapMonths} months
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
