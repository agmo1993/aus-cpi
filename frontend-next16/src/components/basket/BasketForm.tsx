"use client";

/**
 * The basket questionnaire: one question to a card.
 *
 * A real form, with real radios and checkboxes under the cards, so a keyboard
 * moves through the answers by arrow key and Enter submits the step. The
 * inputs are visually hidden rather than replaced, which is what keeps the
 * grouping, the labelling and the focus ring the browser gives for free.
 *
 * Every card carries the weight of what it is asking about, because the weight
 * is the whole reason the question is worth asking: dropping tobacco moves the
 * basket, dropping postal services does not.
 *
 * Full-viewport overlay while immersive chrome is active, with Close /
 * Back available at every step. Site header/footer animate away around it.
 */

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QUESTIONS, type BasketAnswers, type BasketSpending } from "./questions";
import { formatAud, isZeroSpendAnswer, monthlySpending } from "./dollarImpact";

interface BasketFormProps {
  answers: BasketAnswers;
  spending: BasketSpending;
  onAnswer: (questionId: string, picked: string[]) => void;
  onSpending: (questionId: string, amount: number) => void;
  step: number;
  onStep: (step: number) => void;
  weights: Record<string, number>;
  coverage: number;
  onDone: () => void;
  /** Leave the questionnaire without finishing (back to intro or results). */
  onClose: () => void;
}

const BasketForm: React.FC<BasketFormProps> = ({
  answers,
  spending,
  onAnswer,
  onSpending,
  step,
  onStep,
  weights,
  coverage,
  onDone,
  onClose,
}) => {
  const question = QUESTIONS[step];
  const picked = answers[question.id] ?? [];
  const last = step === QUESTIONS.length - 1;
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const [burst, setBurst] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const shareOf = (items: string[]) =>
    items.reduce((sum, item) => sum + (weights[item] ?? 0), 0);

  const currentSpend = spending[question.id] ?? question.defaultSpending;
  const zeroed = isZeroSpendAnswer(question.id, picked);
  const selectedShare = shareOf(
    question.options.filter((option) => picked.includes(option.id)).flatMap((option) => option.keep)
  );

  const spendSoFar = QUESTIONS.reduce((sum, entry) => {
    const amount = spending[entry.id] ?? entry.defaultSpending;
    if (isZeroSpendAnswer(entry.id, answers[entry.id] ?? [])) return sum;
    return sum + monthlySpending(entry.id, amount);
  }, 0);

  const goToStep = (newStep: number, dir: "next" | "prev") => {
    if (isAnimating || newStep < 0 || newStep >= QUESTIONS.length) return;
    setDirection(dir);
    setIsAnimating(true);
    window.setTimeout(() => {
      onStep(newStep);
      setIsAnimating(false);
    }, 300);
  };

  const finish = () => {
    setBurst(true);
    window.setTimeout(() => onDone(), 700);
  };

  const toggle = (optionId: string) => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }

    if (!question.multi) {
      onAnswer(question.id, [optionId]);
      const option = question.options.find((entry) => entry.id === optionId);
      if (option && option.keep.length === 0) {
        onSpending(question.id, 0);
      } else if (currentSpend === 0) {
        onSpending(question.id, question.defaultSpending);
      }
      if (!last) {
        advanceTimer.current = window.setTimeout(() => goToStep(step + 1, "next"), 450);
      }
      return;
    }

    const next = picked.includes(optionId)
      ? picked.filter((id) => id !== optionId)
      : [...picked, optionId];
    onAnswer(question.id, next);
  };

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (last) finish();
    else goToStep(step + 1, "next");
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if ((event.target as HTMLElement).closest("input, textarea, button, label")) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && !last) goToStep(step + 1, "next");
    if (dx > 0 && step > 0) goToStep(step - 1, "prev");
  };

  const dense = question.options.every((option) => !option.detail);

  const cardAnimation = isAnimating
    ? direction === "next"
      ? "flip-out-next"
      : "flip-out-prev"
    : direction === "next"
      ? "flip-in-next"
      : "flip-in-prev";

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-background">
      {burst && <ConfettiBurst />}

      <div className="border-b bg-card/95 px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-sm font-medium">
              Question {step + 1}
              <span className="text-muted-foreground"> of {QUESTIONS.length}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-sm text-muted-foreground">
                {coverage.toFixed(0)}% kept · {formatAud(spendSoFar).replace("+", "")}/mo
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close questionnaire"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Close
              </Button>
            </div>
          </div>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={QUESTIONS.length}
            aria-valuenow={step + 1}
            aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}
          >
            {QUESTIONS.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => index <= step && goToStep(index, index < step ? "prev" : "next")}
                disabled={index > step && !(entry.id in answers)}
                aria-label={`Question ${index + 1}: ${entry.short}`}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors disabled:cursor-not-allowed",
                  index === step
                    ? "bg-primary"
                    : index < step
                      ? "bg-primary/40 hover:bg-primary/60"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 w-full">
        <Card
          key={question.id}
          className={cn("w-full max-w-3xl border-0 shadow-none", cardAnimation)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <form onSubmit={submit}>
            <fieldset>
              <CardHeader className="space-y-2 pb-4 px-0 sm:px-0">
                <legend className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    {question.short}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {question.title}
                  </h2>
                  <p className="max-w-[62ch] text-sm text-muted-foreground">
                    {question.help}
                  </p>
                </legend>
              </CardHeader>

              <CardContent className="space-y-4 px-0 sm:px-0">
                <div className="space-y-2">
                  <label
                    htmlFor={`spending-${question.id}`}
                    className="block text-sm font-medium text-foreground"
                  >
                    {question.spendingLabel}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
                      $
                    </span>
                    <Input
                      id={`spending-${question.id}`}
                      type="number"
                      min="0"
                      step="10"
                      disabled={zeroed}
                      value={zeroed ? 0 : currentSpend}
                      onChange={(e) =>
                        onSpending(question.id, parseFloat(e.target.value) || 0)
                      }
                      className="pl-8 tabular-nums"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Typical household: ${question.defaultSpending.toLocaleString("en-AU")}
                    {question.id === "travel" ? " / year" : " / month"}
                    {zeroed
                      ? ". Set to $0 because this is not in your basket."
                      : currentSpend > 0
                        ? `. This category is ${formatAud(
                            monthlySpending(question.id, currentSpend)
                          ).replace("+", "")}/mo${
                            selectedShare > 0
                              ? `, ${selectedShare.toFixed(1)}% of the published basket`
                              : ""
                          }.`
                        : ""}
                  </p>
                </div>

                <div className={cn("grid gap-3", dense && "sm:grid-cols-2")}>
                  {question.options.map((option) => {
                    const active = picked.includes(option.id);
                    const share = shareOf(option.keep);
                    const Icon = option.icon;

                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all active:scale-[0.98]",
                          "hover:border-primary/50 hover:bg-accent/40",
                          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                          active
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border"
                        )}
                      >
                        <input
                          type={question.multi ? "checkbox" : "radio"}
                          name={question.id}
                          value={option.id}
                          checked={active}
                          onChange={() => toggle(option.id)}
                          className="sr-only"
                        />

                        {Icon && (
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:text-foreground"
                            )}
                            aria-hidden="true"
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                        )}

                        <span className="min-w-0 flex-1 space-y-1">
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{option.label}</span>
                            {share > 0 && (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                                {share.toFixed(1)}%
                              </span>
                            )}
                          </span>
                          {option.detail && (
                            <span className="block text-sm leading-snug text-muted-foreground">
                              {option.detail}
                            </span>
                          )}
                        </span>

                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                            question.multi ? "rounded" : "rounded-full",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {question.multi && (
                  <p className="text-xs text-muted-foreground">
                    Choose any that apply, or none.{" "}
                    {picked.length === 0
                      ? `Nothing here is in your basket, and its ${shareOf(
                          question.governs
                        ).toFixed(1)}% is spread across what is.`
                      : "The weight of anything you leave out is spread across the rest."}
                  </p>
                )}
                {!question.multi && !last && (
                  <p className="text-xs text-muted-foreground">
                    Pick one and the next card flips in. Swipe if you prefer.
                  </p>
                )}
              </CardContent>
            </fieldset>

            <div className="flex items-center justify-between gap-3 border-t px-0 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (step > 0 ? goToStep(step - 1, "prev") : onClose())}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {step === 0 ? "Cancel" : "Back"}
              </Button>

              <Button type="submit">
                {last ? "Build my index" : "Continue"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

function ConfettiBurst() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {pieces.map((i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 8) * 40}ms`,
            background: ["#1E7A4E", "#9B5FC0", "#E0684F", "#2A6FA8", "#A8761F"][i % 5],
          }}
        />
      ))}
    </div>
  );
}

export default BasketForm;
