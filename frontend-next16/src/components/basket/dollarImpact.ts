/**
 * Dollar inflation from the questionnaire spend inputs.
 *
 * Travel is entered as a yearly amount; everything else is monthly.
 * Category CPI is the weight-average of the expenditure classes the
 * answers kept, over the same window as the rest of the results.
 */

import { change } from "@/lib/basket";
import type { BasketInputs } from "@/types/basket";
import { QUESTIONS, keptBy, type BasketAnswers, type BasketSpending } from "./questions";

export function monthlySpending(questionId: string, amount: number): number {
  return questionId === "travel" ? amount / 12 : amount;
}

/** True when the picked options keep nothing in this question's governed set. */
export function isZeroSpendAnswer(questionId: string, picked: string[]): boolean {
  const question = QUESTIONS.find((entry) => entry.id === questionId);
  if (!question || picked.length === 0) return false;
  return keptBy(question, picked).size === 0;
}

export interface DollarImpactRow {
  questionId: string;
  short: string;
  monthlySpend: number;
  monthlyChange: number;
  yearlyChange: number;
}

export function computeDollarImpact(
  inputs: BasketInputs,
  city: string,
  spending: BasketSpending,
  answers: BasketAnswers,
  from: number,
  last: number
): DollarImpactRow[] {
  const series = inputs.series[city] ?? {};
  const weights = inputs.weights[city] ?? {};

  return QUESTIONS.map((question) => {
    const picked = answers[question.id] ?? [];
    const raw = spending[question.id] ?? question.defaultSpending;
    const monthlySpend = monthlySpending(question.id, raw);

    if (picked.length === 0 || monthlySpend <= 0) {
      return {
        questionId: question.id,
        short: question.short,
        monthlySpend,
        monthlyChange: 0,
        yearlyChange: 0,
      };
    }

    const selectedClasses = [...keptBy(question, picked)].filter(
      (item) => series[item] && (weights[item] ?? 0) > 0
    );
    const totalWeight = selectedClasses.reduce((sum, item) => sum + weights[item], 0);

    let weightedChange = 0;
    if (totalWeight > 0) {
      for (const item of selectedClasses) {
        const itemChange = change(series[item], from, last);
        if (itemChange !== null) {
          weightedChange += (weights[item] / totalWeight) * itemChange;
        }
      }
    }

    const monthlyChange = monthlySpend * (weightedChange / 100);
    return {
      questionId: question.id,
      short: question.short,
      monthlySpend,
      monthlyChange,
      yearlyChange: monthlyChange * 12,
    };
  }).filter((row) => row.monthlySpend > 0 && (answers[row.questionId] ?? []).length > 0);
}

export function questionIndexForItem(item: string): number {
  return QUESTIONS.findIndex((question) => question.governs.includes(item));
}

export function formatAud(value: number, digits = 0): string {
  const abs = Math.abs(value).toLocaleString("en-AU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (value > 0) return `+$${abs}`;
  if (value < 0) return `-$${abs}`;
  return `$${abs}`;
}
