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
import { computeDollarImpact, formatAud, questionIndexForItem } from "./dollarImpact";
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
  onSpending?: (questionId: string, amount: number) => void;
  onEditQuestion?: (index: number) => void;
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
  onSpending,
  onEditQuestion,
}) => {
  const [mode, setMode] = useState<ChartMode>("change");

  const months = inputs.months;
  const last = months.length - 1;
  const headline = inputs.headline[city] ?? [];

  const yours = change(result.index, from, last);
  const published = change(headline, from, last);
  const gap = yours !== null && published !== null ? yours - published : null;

  const dollarImpact = computeDollarImpact(inputs, city, spending, answers, from, last);
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
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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
                  {formatAud(totalMonthlyChange, 2)}
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
                  {formatAud(totalYearlyChange, 2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What if you spent less?
              </p>
              <div className="space-y-3">
                {dollarImpact.map((row) => {
                  const question = QUESTIONS.find((entry) => entry.id === row.questionId);
                  if (!question) return null;
                  const stored = spending[question.id] ?? question.defaultSpending;
                  const max = Math.max(question.defaultSpending * 3, stored, 100);
                  return (
                    <div key={question.id} className="space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{question.short}</span>
                        <span
                          className={cn(
                            "tabular-nums text-sm font-semibold",
                            row.monthlyChange > 0
                              ? "text-danger"
                              : row.monthlyChange < 0
                                ? "text-success"
                                : ""
                          )}
                        >
                          {formatAud(row.monthlyChange, 2)}/mo
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={max}
                        step={question.id === "travel" ? 50 : 10}
                        value={stored}
                        aria-label={`${question.short} spending`}
                        onChange={(event) =>
                          onSpending?.(question.id, Number(event.target.value))
                        }
                        className="w-full accent-primary"
                      />
                      <p className="text-xs text-muted-foreground tabular-nums">
                        ${stored.toLocaleString("en-AU")}
                        {question.id === "travel" ? " / year" : " / month"}
                      </p>
                    </div>
                  );
                })}
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

      <div className="grid w-full min-w-0 gap-6 lg:grid-cols-12">
        <div className="min-w-0 w-full lg:col-span-7">
          <ContributionTable
            contributions={contributions}
            windowLabel={windowLabel}
            total={yours}
            onItemClick={
              onEditQuestion
                ? (item) => {
                    const index = questionIndexForItem(item);
                    if (index >= 0) onEditQuestion(index);
                  }
                : undefined
            }
          />
        </div>

        <Card className="min-w-0 w-full overflow-hidden lg:col-span-5">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle>Where the weight sits</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your basket renormalised to 100, against the official weight of the
              same group.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {composition.map((entry) => (
              <div key={entry.group} className="space-y-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-sm min-w-0">
                  <span className="min-w-0 truncate">{entry.group}</span>
                  <span className="shrink-0 tabular-nums text-xs sm:text-sm">
                    {entry.share.toFixed(1)}%
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      off. {entry.official.toFixed(1)}%
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
