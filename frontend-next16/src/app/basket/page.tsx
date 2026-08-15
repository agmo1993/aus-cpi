/**
 * Basket Page
 *
 * Build a CPI from the categories that apply to you. The published index is
 * the weighted average of a household that does not exist: it rents and owns,
 * drives and takes the bus, smokes a little. Dropping the parts that are not
 * yours and renormalising what is left gives the same arithmetic the ABS runs,
 * over a basket that is.
 */

import type { Metadata } from "next";
import { getBasketInputs } from "@/lib/queries/weights";
import { formatBasketMonth } from "@/lib/basket";
import { BasketBuilder } from "@/components/basket";

// The index is republished monthly and the page reads the latest month at
// request time, as the rest of the site does.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your basket · Aus-CPI",
  description:
    "Build a consumer price index from the categories you actually spend on, using the ABS weighting pattern, and compare it against the published CPI.",
};

interface BasketPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Basket({ searchParams }: BasketPageProps) {
  const [inputs, params] = await Promise.all([getBasketInputs(), searchParams]);
  const months = inputs.months;

  // A shared basket is read here rather than in the browser, so the link
  // renders the basket it points at on the first paint instead of the default
  // one and then swapping.
  const code = typeof params.b === "string" ? params.b : null;
  const city = typeof params.city === "string" ? params.city : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Your basket</h1>
        <p className="max-w-[70ch] text-muted-foreground">
          The published CPI prices a basket averaged over every household in the
          country: one that rents and owns, drives and takes the bus, smokes a
          little. Answer eight questions and the index is rebuilt from the{" "}
          {inputs.pattern} weighting pattern — the same chain Laspeyres
          arithmetic the ABS uses, over your basket instead of the average one.
        </p>
      </div>

      <BasketBuilder
        inputs={inputs}
        sharedCode={code}
        sharedCity={city && inputs.cities.includes(city) ? city : null}
      />

      <p className="max-w-[70ch] text-sm text-muted-foreground">
        Weights come from the ABS {inputs.pattern} weighting pattern, which is
        price-updated to {formatBasketMonth(inputs.linkPeriod)}. Index numbers
        can only be aggregated with the weights of their own link period, so the
        series starts there and runs to{" "}
        {formatBasketMonth(months[months.length - 1])}. Selecting every category
        reproduces the published CPI to within 0.01 index points.
      </p>
    </div>
  );
}
