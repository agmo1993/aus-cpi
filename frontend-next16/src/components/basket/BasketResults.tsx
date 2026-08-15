"use client";

/**
 * What the answers add up to: the rebuilt index, and the reading of it.
 *
 * Four things, in the order the question is usually asked — what is my number,
 * how has it moved against the published one, what moved it, and where my
 * basket sits differently from the average household's.
 */

import React, { useState } from "react";
import { TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import {
  change,
  computeContributions,
  formatBasketMonth,
  groupShares,
} from "@/lib/basket";
import type { BasketInputs, BasketResult } from "@/types/basket";
import BasketChart, { type ChartMode } from "./BasketChart";
import ContributionTable from "./ContributionTable";

interface BasketResultsProps {
  inputs: BasketInputs;
  city: string;
  result: BasketResult;
  /** Position in `months` the window opens at; it always closes at the latest. */
  from: number;
  /** The window in words, e.g. '12 months to Jun 2026'. */
  windowLabel: string;
}

const signed = (value: number, digits = 1) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;

const BasketResults: React.FC<BasketResultsProps> = ({
  inputs,
  city,
  result,
  from,
  windowLabel,
}) => {
  const [mode, setMode] = useState<ChartMode>("change");

  const months = inputs.months;
  const last = months.length - 1;
  const headline = inputs.headline[city] ?? [];

  const yours = change(result.index, from, last);
  const published = change(headline, from, last);
  const gap = yours !== null && published !== null ? yours - published : null;

  // Left unmemoized: the React Compiler caches these, and by hand it is a few
  // hundred multiplications over 87 items either way.
  const contributions = computeContributions(inputs, city, result, from, last);

  const official = inputs.weights[city] ?? {};
  const composition = groupShares(inputs.tree, result.shares).map((entry) => ({
    ...entry,
    official: official[entry.group] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Your inflation"
          value={yours === null ? "n/a" : `${signed(yours)}%`}
          icon={Wallet}
          trend={
            gap === null
              ? undefined
              : {
                  value: `${signed(gap)}pp`,
                  label: "vs published",
                  direction: gap > 0.05 ? "up" : gap < -0.05 ? "down" : "neutral",
                }
          }
        />
        <StatCard
          title="Published CPI"
          value={published === null ? "n/a" : `${signed(published)}%`}
          icon={TrendingUp}
          iconColor="text-chart-4"
          iconBgColor="bg-chart-4/10"
          trend={{ value: windowLabel, label: "", direction: "neutral" }}
        />
        <StatCard
          title="Index level"
          value={result.index[last].toFixed(2)}
          trend={{
            value: headline[last]?.toFixed(2) ?? "n/a",
            label: "published",
            direction: "neutral",
          }}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Your basket against the published CPI</CardTitle>
            <p className="text-sm text-muted-foreground">
              {city === "Australia"
                ? "Weighted average of eight capital cities"
                : city}
              , {formatBasketMonth(months[0])} to {formatBasketMonth(months[last])}
            </p>
          </div>
          <div
            className="flex shrink-0 rounded-lg border p-0.5"
            role="group"
            aria-label="Chart view"
          >
            {(
              [
                ["change", "Change"],
                ["level", "Index"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  mode === value
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <BasketChart
            months={months}
            basket={result.index}
            headline={headline}
            mode={mode}
            city={city === "Australia" ? "Australia" : city}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContributionTable
            contributions={contributions}
            windowLabel={windowLabel}
            total={yours}
          />
        </div>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle>Where the weight sits</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your basket renormalised to 100, against the official weight of the
              same group.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {composition.map((entry) => (
              <div key={entry.group} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{entry.group}</span>
                  <span className="shrink-0 tabular-nums">
                    {entry.share.toFixed(1)}%
                    <span className="ml-2 text-xs text-muted-foreground">
                      official {entry.official.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${entry.share}%` }}
                  />
                  {/* The official weight as a tick, so over- and under-weighting
                      is readable without a second bar. */}
                  <span
                    className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/50"
                    style={{ left: `${entry.official}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BasketResults;
