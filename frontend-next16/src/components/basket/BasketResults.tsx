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
import type { BasketAnswers, BasketSpending } from "./questions";
import { QUESTIONS } from "./questions";
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
  /** Dollar spending per question category. */
  spending: BasketSpending;
  /** Current answers per question. */
  answers: BasketAnswers;
}

const signed = (value: number, digits = 1) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;

const BasketResults: React.FC<BasketResultsProps> = ({
  inputs,
  city,
  result,
  from,
  windowLabel,
  spending,
  answers,
}) => {
  const [mode, setMode] = useState<ChartMode>("change");

  const months = inputs.months;
  const last = months.length - 1;
  const headline = inputs.headline[city] ?? [];

  const yours = change(result.index, from, last);
  const published = change(headline, from, last);
  const gap = yours !== null && published !== null ? yours - published : null;

  // Calculate dollar impact per category
  const dollarImpact = QUESTIONS.map((q) => {
    const monthlySpend = spending[q.id] ?? q.defaultSpending;
    const picked = answers[q.id] ?? [];
    
    // Only calculate if this category has selections
    if (picked.length === 0) {
      return {
        question: q,
        monthlySpend,
        monthlyChange: 0,
        yearlyChange: 0,
        totalChange: 0,
      };
    }

    // Calculate average CPI change for this category's expenditure classes
    const selectedClasses = q.options
      .filter(opt => picked.includes(opt.id))
      .flatMap(opt => opt.keep);
    
    const series = inputs.series[city] ?? {};
    const validClasses = selectedClasses.filter(item => series[item] && inputs.weights[city]?.[item] > 0);
    
    if (validClasses.length === 0) {
      return {
        question: q,
        monthlySpend,
        monthlyChange: 0,
        yearlyChange: 0,
        totalChange: 0,
      };
    }

    // Weight the CPI changes by the expenditure class weights
    const weights = inputs.weights[city] ?? {};
    const totalWeight = validClasses.reduce((sum, item) => sum + weights[item], 0);
    
    let weightedChange = 0;
    for (const item of validClasses) {
      const itemWeight = weights[item] / totalWeight;
      const itemChange = change(series[item], from, last);
      if (itemChange !== null) {
        weightedChange += itemChange * itemWeight;
      }
    }

    const monthlyChange = monthlySpend * (weightedChange / 100);
    const yearlyChange = monthlyChange * 12;
    
    return {
      question: q,
      monthlySpend,
      monthlyChange,
      yearlyChange,
      totalChange: monthlyChange,
    };
  }).filter(imp => imp.monthlySpend > 0 && (answers[imp.question.id] ?? []).length > 0);

  const totalMonthlyChange = dollarImpact.reduce((sum, imp) => sum + imp.monthlyChange, 0);
  const totalYearlyChange = dollarImpact.reduce((sum, imp) => sum + imp.yearlyChange, 0);

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

      {/* Dollar Impact Summary */}
      {dollarImpact.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Dollar Impact</CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on your spending, here's how inflation affects your wallet
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Monthly Change
                </p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums mt-1",
                  totalMonthlyChange > 0 ? "text-danger" : totalMonthlyChange < 0 ? "text-success" : ""
                )}>
                  {totalMonthlyChange > 0 ? "+" : ""}${totalMonthlyChange.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Yearly Change
                </p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums mt-1",
                  totalYearlyChange > 0 ? "text-danger" : totalYearlyChange < 0 ? "text-success" : ""
                )}>
                  {totalYearlyChange > 0 ? "+" : ""}${totalYearlyChange.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Breakdown by Category
              </p>
              <div className="space-y-1.5">
                {dollarImpact.map(({ question, monthlySpend, monthlyChange, yearlyChange }) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <span className="font-medium">{question.short}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ${monthlySpend}/mo
                      </span>
                      <span className={cn(
                        "text-sm font-semibold tabular-nums min-w-[80px] text-right",
                        monthlyChange > 0 ? "text-danger" : monthlyChange < 0 ? "text-success" : ""
                      )}>
                        {monthlyChange > 0 ? "+" : ""}${monthlyChange.toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
