"use client";

/**
 * What moved the basket, and how much of the move each item owns.
 *
 * An item is large here for one of two reasons — it moved a lot, or it is a
 * large share of the basket — which is why the price change and the share sit
 * next to the contribution rather than being folded into a single ranking.
 * The contributions sum to the basket's change exactly, so the table is a
 * decomposition and not a top-N list with a remainder hidden off the bottom.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BasketContribution } from "@/types/basket";

interface ContributionTableProps {
  contributions: BasketContribution[];
  /** The window the changes are measured over, e.g. '12 months to Jun 2026'. */
  windowLabel: string;
  /** The basket's own change, which the contributions add up to. */
  total: number | null;
}

/** Rows shown before the table has to be expanded. */
const PREVIEW = 10;

const ContributionTable: React.FC<ContributionTableProps> = ({
  contributions,
  windowLabel,
  total,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Ranked by contribution, so the two ends of the list are the items pushing
  // the basket up and the ones holding it down. The preview keeps both ends.
  const rows = expanded
    ? contributions
    : [
        ...contributions.slice(0, PREVIEW),
        ...contributions.slice(-3).filter((row) => row.contribution < 0),
      ].filter(
        (row, index, all) => all.findIndex((other) => other.item === row.item) === index
      );

  const widest = Math.max(
    ...contributions.map((row) => Math.abs(row.contribution)),
    0.01
  );

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle>What moved your basket</CardTitle>
          {total !== null && (
            <span className="text-sm text-muted-foreground">
              {windowLabel} · adds to{" "}
              <span className="font-medium tabular-nums text-foreground">
                {total > 0 ? "+" : total < 0 ? "−" : ""}
                {Math.abs(total).toFixed(2)}%
              </span>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="w-[40%] px-3 py-2 text-left font-medium sm:w-auto sm:px-6">
                  Item
                </th>
                <th scope="col" className="w-[18%] px-1 py-2 text-right font-medium sm:px-3">
                  Share
                </th>
                <th scope="col" className="w-[18%] px-1 py-2 text-right font-medium sm:px-3">
                  Price
                </th>
                <th scope="col" className="w-[24%] px-3 py-2 text-right font-medium sm:px-6">
                  Contrib.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-3 py-2 sm:px-6">
                    <div className="truncate" title={row.item}>
                      {row.item}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {row.group}
                    </div>
                  </td>
                  <td className="px-1 py-2 text-right tabular-nums text-muted-foreground sm:px-3">
                    {row.share.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      "px-1 py-2 text-right tabular-nums sm:px-3",
                      row.itemChange > 0 ? "text-danger" : row.itemChange < 0 ? "text-success" : ""
                    )}
                  >
                    {row.itemChange > 0 ? "+" : row.itemChange < 0 ? "−" : ""}
                    {Math.abs(row.itemChange).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 sm:px-6">
                    <div className="flex items-center justify-end gap-2 sm:gap-3">
                      {/* A bar either side of a shared centre line: the sign
                          is the whole point of this column. */}
                      <div className="relative hidden h-1.5 w-24 rounded-full bg-muted sm:block">
                        <span
                          className={cn(
                            "absolute top-0 h-full rounded-full",
                            row.contribution >= 0 ? "bg-danger left-1/2" : "bg-success right-1/2"
                          )}
                          style={{
                            width: `${(Math.abs(row.contribution) / widest) * 50}%`,
                          }}
                        />
                      </div>
                      <span className="text-right tabular-nums">
                        {row.contribution > 0 ? "+" : row.contribution < 0 ? "−" : ""}
                        {Math.abs(row.contribution).toFixed(2)}pp
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contributions.length > rows.length || expanded ? (
          <div className="border-t px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {expanded
                ? "Show fewer"
                : `Show all ${contributions.length} items`}
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ContributionTable;
