"use client";

/**
 * The interactive part of /basket.
 *
 * Two ways in to the same arithmetic. The form asks eight questions and turns
 * the answers into a set of expenditure classes; the tree lets anyone who
 * wants it edit those classes directly. The tree is the honest interface and
 * the form is the usable one, so the form leads and the tree stays a click
 * away underneath the results.
 *
 * Everything needed to rebuild the index for any city and any selection is
 * handed over once by the server, so a click re-runs the aggregation locally
 * rather than making a round trip. It is 87 multiplications per month.
 */

import React, { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ListTree,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  allLeaves,
  computeBasket,
  decodeSelection,
  encodeSelection,
  formatBasketMonth,
} from "@/lib/basket";
import type { BasketInputs } from "@/types/basket";
import {
  DEFAULT_ANSWERS,
  QUESTIONS,
  answersFromSelection,
  selectionFromAnswers,
  type BasketAnswers,
} from "./questions";
import BasketForm from "./BasketForm";
import BasketResults from "./BasketResults";
import CategoryTree from "./CategoryTree";

interface BasketBuilderProps {
  inputs: BasketInputs;
  /** A basket code from the ?b= parameter, when the page was opened from a share link. */
  sharedCode: string | null;
  /** A location from the ?city= parameter, already checked against the loaded pattern. */
  sharedCity: string | null;
}

/** Where the basket is kept between visits. */
const STORAGE_KEY = "auscpi.basket.v2";

/** The two windows worth reading off a single link period. */
type Period = "annual" | "link";

/**
 * The saved basket: the answers, and the selection if it was edited by hand.
 *
 * Both are kept because they answer different questions. The selection is what
 * the index is built from and is the only thing a share link can carry; the
 * answers are what the form has to show when the reader comes back to change
 * one of them, and they cannot be recovered exactly from a selection.
 */
interface BasketState {
  answers: BasketAnswers;
  /** An encoded selection, set once the reader edits the tree directly. */
  manual: string | null;
}

/**
 * The saved state, read through useSyncExternalStore.
 *
 * localStorage cannot be read while rendering on the server, and reading it
 * during the first client render would hydrate against markup built without
 * it. This is the case the hook exists for: the server snapshot is null, so
 * both sides render the default basket, and the saved one arrives in the
 * re-render straight after hydration. The storage event also keeps two tabs
 * of the page in step for free.
 */
function subscribeToSaved(onChange: () => void) {
  globalThis.addEventListener("storage", onChange);
  return () => globalThis.removeEventListener("storage", onChange);
}

const readSaved = () => localStorage.getItem(STORAGE_KEY);
const noSaved = () => null;

/** A stored blob, or null if it is missing, truncated or from an older shape. */
function parse(raw: string | null): BasketState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<BasketState>;
    if (!value || typeof value.answers !== "object" || value.answers === null) {
      return null;
    }
    return { answers: value.answers, manual: value.manual ?? null };
  } catch {
    return null;
  }
}

const BasketBuilder: React.FC<BasketBuilderProps> = ({
  inputs,
  sharedCode,
  sharedCity,
}) => {
  // Nothing here is memoized by hand: the React Compiler caches what is worth
  // caching, and the aggregation itself is 87 multiplications a month.
  const leaves = allLeaves(inputs.tree);

  const stored = parse(useSyncExternalStore(subscribeToSaved, readSaved, noSaved));
  // Set by the reader's own edits, which outrank both a shared link and
  // whatever was saved last visit.
  const [edited, setEdited] = useState<BasketState | null>(null);

  const sharedItems = decodeSelection(sharedCode, leaves);
  // The link carries a selection, not answers, so the form's controls are read
  // back off it as closely as they can be.
  const shared: BasketState | null =
    sharedItems && sharedCode
      ? { answers: answersFromSelection(new Set(sharedItems)), manual: sharedCode }
      : null;

  const state = edited ??
    shared ??
    stored ?? { answers: DEFAULT_ANSWERS, manual: null };

  const [city, setCity] = useState(sharedCity ?? inputs.cities[0] ?? "Australia");
  const [period, setPeriod] = useState<Period>("annual");
  const [copied, setCopied] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [step, setStep] = useState(0);

  // Always start with the form to show the interactive card flow.
  // Previous answers are pre-filled so returning users can review/modify.
  const [phase, setPhase] = useState<"intro" | "form" | "results" | null>(null);
  const showing = phase ?? "intro";

  const manual = decodeSelection(state.manual, leaves);
  const selected = new Set(manual ?? selectionFromAnswers(state.answers, leaves));

  const commit = (next: BasketState) => {
    setEdited(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // An answer supersedes any hand-editing: the two cannot both be in force,
  // and the one just given is the one the reader meant.
  const answer = (questionId: string, picked: string[]) =>
    commit({ answers: { ...state.answers, [questionId]: picked }, manual: null });

  const toggle = (items: string[], select: boolean) => {
    const next = new Set(selected);
    for (const item of items) {
      if (select) next.add(item);
      else next.delete(item);
    }
    commit({ answers: state.answers, manual: encodeSelection(next, leaves) });
  };

  const restart = () => {
    commit({ answers: DEFAULT_ANSWERS, manual: null });
    setStep(0);
    setPhase("intro");
  };

  /** Back to a single question, with the form's controls matching what is shown. */
  const editQuestion = (index: number) => {
    // Re-derived first where the tree has been used, so the card the reader
    // lands on is not showing an answer the basket stopped obeying.
    if (state.manual) commit({ answers: answersFromSelection(selected), manual: null });
    setStep(index);
    setPhase("form");
  };

  const result = computeBasket(inputs, city, selected);

  const months = inputs.months;
  const last = months.length - 1;

  // The annual window needs thirteen months of the same link period. Where the
  // pattern is younger than that there is no twelve-month change to show, and
  // the control falls back to the whole link period rather than inventing one
  // by reaching back across the re-weighting.
  const annualAvailable = months.length >= 13;
  const from = period === "annual" && annualAvailable ? last - 12 : 0;

  const windowLabel =
    period === "annual" && annualAvailable
      ? `12 months to ${formatBasketMonth(months[last])}`
      : `since ${formatBasketMonth(months[0])}`;

  const share = () => {
    const url = new URL(globalThis.location.href);
    url.searchParams.set("city", city);
    url.searchParams.set("b", encodeSelection(selected, leaves));
    void navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // What the chips say. Where the tree has been used the stored answers are
  // stale, so they are read back off the selection instead.
  const shownAnswers = state.manual ? answersFromSelection(selected) : state.answers;

  if (showing === "intro") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your Personal CPI
          </h1>
          <p className="text-lg text-muted-foreground">
            Answer 8 quick questions about your household to calculate how inflation
            affects you personally, not the average Australian.
          </p>
          <button
            type="button"
            onClick={() => setPhase("form")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Start the questionnaire
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  if (showing === "form") {
    return (
      <BasketForm
        answers={state.answers}
        onAnswer={answer}
        step={step}
        onStep={setStep}
        weights={inputs.weights[city] ?? {}}
        coverage={result.coverage}
        onDone={() => setPhase("results")}
      />
    );
  }

  const empty = result.index.length === 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-[200px]" aria-label="Location">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inputs.cities.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "Australia" ? "Australia (8 capitals)" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-lg border p-0.5" role="group" aria-label="Period">
          {(
            [
              ["annual", "Last 12 months"],
              ["link", `Since ${formatBasketMonth(months[0])}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              disabled={value === "annual" && !annualAvailable}
              aria-pressed={period === value}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40",
                period === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={share}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent/60"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" strokeWidth={2} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} />
          )}
          {copied ? "Link copied" : "Copy link to this basket"}
        </button>
      </div>

      {/* The answers, as given, and each one a way back to its card. */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Your answers</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selected.size} of {leaves.length} expenditure classes,{" "}
              {result.coverage.toFixed(1)}% of the published basket by weight.
              {/* A shared basket also arrives as a selection rather than as
                  answers, but it was nobody here who edited it. */}
              {state === shared
                ? " Opened from a shared link."
                : state.manual
                  ? " Edited by hand below."
                  : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => editQuestion(0)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-accent/60"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              Edit answers
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Start over
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((question, index) => {
              const picked = shownAnswers[question.id] ?? [];
              const labels = question.options
                .filter((option) => picked.includes(option.id))
                .map((option) => option.label);

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => editQuestion(index)}
                  className="group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
                >
                  <span className="text-muted-foreground">{question.short}</span>
                  <span className="font-medium">
                    {labels.length > 0 ? labels.join(", ") : "None"}
                  </span>
                  <Pencil
                    className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.min(result.coverage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {empty ? (
        <Card>
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-2 p-10 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium">Nothing selected</p>
            <p className="max-w-[42ch] text-sm text-muted-foreground">
              Every category has been unticked, so there is no basket to price.
              Answer the questions again, or tick something below.
            </p>
          </CardContent>
        </Card>
      ) : (
        <BasketResults
          inputs={inputs}
          city={city}
          result={result}
          from={from}
          windowLabel={windowLabel}
        />
      )}

      {/* The tree, for anyone whose basket the eight questions do not describe. */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setTuning((open) => !open)}
            aria-expanded={tuning}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                Fine-tune every category
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All {leaves.length} expenditure classes, with the weight the ABS
                gives each one in {city === "Australia" ? "Australia" : city}.
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {tuning ? "Hide" : "Show"}
            </span>
          </button>
        </CardHeader>
        {tuning && (
          <CardContent className="pt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryTree
                tree={inputs.tree}
                weights={inputs.weights[city] ?? {}}
                selected={selected}
                onChange={toggle}
              />
              <div className="space-y-3 text-sm text-muted-foreground lg:border-l lg:pl-6">
                <p className="flex items-start gap-2">
                  <ListTree className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Ticking a group ticks the expenditure classes under it. The
                  aggregation only ever runs at the class level, so nothing is
                  counted twice.
                </p>
                <p>
                  Whatever you untick has its weight spread across everything
                  that is left, in proportion to what those items already carry.
                  The basket always sums to 100.
                </p>
                <p>
                  Editing here takes over from your answers. The chips above
                  will be read back from what is ticked, as closely as eight
                  questions can describe it.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default BasketBuilder;
