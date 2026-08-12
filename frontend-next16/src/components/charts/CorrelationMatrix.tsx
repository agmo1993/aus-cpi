"use client";

/**
 * CorrelationMatrix
 * Pairwise Pearson correlation between the selected CPI series.
 *
 * Two series produce one number, so they get a figure rather than a chart: a
 * one-cell heatmap is a worse way to read a single value. Three or more get
 * the matrix.
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useColorScheme } from "@/lib/use-color-scheme";
import {
  buildMatrix,
  correlationColor,
  correlationStrength,
  inkFor,
} from "@/lib/correlation";
import type { CorrelationData } from "@/types/cpi";

interface CorrelationMatrixProps {
  pairs: CorrelationData[];
  /** One label per series, in the order they were sent to the API. */
  labels: string[];
  className?: string;
}

/** Steps shown in the legend, from perfectly opposed to perfectly aligned. */
const LEGEND_STOPS = [-1, -0.5, 0, 0.5, 1];

function formatR(value: number): string {
  return value.toFixed(2);
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  pairs,
  labels,
  className = "",
}) => {
  const scheme = useColorScheme();

  if (labels.length < 2) return null;

  // Two series: one coefficient. Report it as a figure.
  if (labels.length === 2) {
    const pair = pairs[0];

    if (!pair) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="text-base">Correlation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These two series could not be correlated.
            </p>
          </CardContent>
        </Card>
      );
    }

    const fill = correlationColor(pair.corr, scheme);

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Correlation</CardTitle>
          <CardDescription>
            How closely the two series have moved together, over the months they
            both cover.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-5">
            <span
              className="inline-block h-14 w-2 rounded-full"
              style={{ backgroundColor: fill }}
              aria-hidden="true"
            />
            <div>
              <div className="text-5xl font-semibold tabular-nums tracking-tight">
                {formatR(pair.corr)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {correlationStrength(pair.corr)}{" "}
                {pair.corr < 0 ? "inverse" : "positive"} relationship
              </p>
            </div>
            <p className="max-w-[34ch] text-sm text-muted-foreground">
              {labels[0]} against {labels[1]}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const matrix = buildMatrix(pairs, labels.length);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Correlation matrix</CardTitle>
        <CardDescription>
          Pearson correlation for every pair, over the months they all cover.
          1.00 means the two series moved in perfect step, 0 means no linear
          relationship, and -1.00 means they moved in exact opposition.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Wide matrices scroll inside the card rather than pushing the page */}
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-sm">
            <caption className="sr-only">
              Pairwise Pearson correlation between the selected CPI series
            </caption>
            <thead>
              <tr>
                <th className="w-48" />
                {labels.map((label, index) => (
                  <th
                    key={index}
                    scope="col"
                    title={label}
                    className="p-1 text-center align-bottom text-xs font-medium text-muted-foreground"
                  >
                    {/* Numbered columns: the full names live in the row headers */}
                    {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th
                    scope="row"
                    title={labels[rowIndex]}
                    className="max-w-48 truncate py-1 pr-3 text-left text-xs font-medium"
                  >
                    <span className="text-muted-foreground">{rowIndex + 1}.</span>{" "}
                    {labels[rowIndex]}
                  </th>

                  {row.map((value, colIndex) => {
                    if (value === null) {
                      return (
                        <td
                          key={colIndex}
                          className="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground"
                        >
                          n/a
                        </td>
                      );
                    }

                    const isDiagonal = rowIndex === colIndex;
                    const fill = correlationColor(value, scheme);

                    return (
                      <td
                        key={colIndex}
                        // The number is in the cell, so colour is a second
                        // reading of the value and never the only one.
                        style={
                          isDiagonal
                            ? undefined
                            : { backgroundColor: fill, color: inkFor(fill) }
                        }
                        className={
                          isDiagonal
                            ? "rounded-md bg-muted/50 p-2 text-center text-xs tabular-nums text-muted-foreground"
                            : "rounded-md p-2 text-center text-xs font-medium tabular-nums"
                        }
                        title={
                          isDiagonal
                            ? `${labels[rowIndex]} against itself`
                            : `${labels[rowIndex]} against ${labels[colIndex]}: ${formatR(value)}, ${correlationStrength(value)} ${value < 0 ? "inverse" : "positive"}`
                        }
                      >
                        {formatR(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend: identity is never carried by colour alone */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Opposed</span>
          <span className="flex items-center gap-1">
            {LEGEND_STOPS.map((stop) => (
              <span
                key={stop}
                className="h-4 w-8 rounded-sm"
                style={{ backgroundColor: correlationColor(stop, scheme) }}
                aria-hidden="true"
              />
            ))}
          </span>
          <span>Aligned</span>
          <span className="tabular-nums">(-1.00 to 1.00)</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
