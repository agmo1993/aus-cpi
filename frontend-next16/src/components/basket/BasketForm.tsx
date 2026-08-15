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
 */

import React from "react";
import { ArrowLeft, ArrowRight, Check, ListTree } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QUESTIONS, type BasketAnswers } from "./questions";

interface BasketFormProps {
  /** The current answers, one entry per question the reader has reached. */
  answers: BasketAnswers;
  onAnswer: (questionId: string, picked: string[]) => void;
  /** Which card is showing, controlled so the results view can send the reader back. */
  step: number;
  onStep: (step: number) => void;
  /** Official weights for the chosen city, for the share each answer is worth. */
  weights: Record<string, number>;
  /** Share of the published basket the answers so far have kept. */
  coverage: number;
  /** Leaves the last card's Continue, and the skip link on every card. */
  onDone: () => void;
}

const BasketForm: React.FC<BasketFormProps> = ({
  answers,
  onAnswer,
  step,
  onStep,
  weights,
  coverage,
  onDone,
}) => {
  const question = QUESTIONS[step];
  const picked = answers[question.id] ?? [];
  const last = step === QUESTIONS.length - 1;

  // The weight an answer is worth: what it keeps, as a share of the published
  // basket. Looked up per city, so Sydney's rents and Hobart's are not the
  // same number.
  const shareOf = (items: string[]) =>
    items.reduce((sum, item) => sum + (weights[item] ?? 0), 0);

  const toggle = (optionId: string) => {
    if (!question.multi) {
      onAnswer(question.id, [optionId]);
      return;
    }
    onAnswer(
      question.id,
      picked.includes(optionId)
        ? picked.filter((id) => id !== optionId)
        : [...picked, optionId]
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (last) onDone();
    else onStep(step + 1);
  };

  // Cards with an explanatory line under each answer read as a list; the ones
  // without are short enough to sit two abreast.
  const dense = question.options.every((option) => !option.detail);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* Progress rail. Answered steps are clickable, so a reader who changes
          their mind three cards later does not have to walk back. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium">
            Question {step + 1}
            <span className="text-muted-foreground"> of {QUESTIONS.length}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">
            {coverage.toFixed(0)}% of the published basket kept
          </span>
        </div>
        <div className="flex gap-1.5">
          {QUESTIONS.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onStep(index)}
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

      <Card
        // Remounting on the step is what makes the card animate in rather than
        // its contents swapping under a static frame.
        key={question.id}
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <form onSubmit={submit}>
          <fieldset>
            <CardHeader className="space-y-2 pb-4">
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

            <CardContent className="space-y-4">
              <div className={cn("grid gap-3", dense && "sm:grid-cols-2")}>
                {question.options.map((option) => {
                  const active = picked.includes(option.id);
                  const share = shareOf(option.keep);
                  const Icon = option.icon;

                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
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
                  Choose any that apply, or none —{" "}
                  {picked.length === 0
                    ? `nothing here is in your basket, and its ${shareOf(
                        question.governs
                      ).toFixed(1)}% is spread across what is.`
                    : "the weight of anything you leave out is spread across the rest."}
                </p>
              )}
            </CardContent>
          </fieldset>

          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <button
              type="button"
              onClick={() => onStep(step - 1)}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {last ? "Build my index" : "Continue"}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </form>
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ListTree className="h-3.5 w-3.5" strokeWidth={1.75} />
          Skip the questions and pick categories myself
        </button>
      </div>
    </div>
  );
};

export default BasketForm;
