"use client";

/**
 * Generative UI parts rendered under assistant replies (Claude-style artifacts).
 */

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnswerPart } from "@/lib/chat/schema";

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
      return (
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          {part.series.map((s, i) => {
            const last = s.points[s.points.length - 1];
            return (
              <div
                key={`${s.seriesid ?? s.label}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <div>
                  {s.seriesid ? (
                    <Link
                      href={`/category?s=${encodeURIComponent(s.seriesid)}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {s.label}
                    </Link>
                  ) : (
                    <span className="font-medium">{s.label}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.points.length} points
                  </span>
                </div>
                {last && (
                  <span className="tabular-nums text-muted-foreground">
                    last {last.date}:{" "}
                    <span className="font-medium text-foreground">
                      {last.value}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );

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
