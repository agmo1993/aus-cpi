"use client";

/**
 * ChartSelector Component
 * Multi-select autocomplete for CPI categories with chart visualization
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import MultiLineChart from "@/components/charts/MultiLineChart";
import CorrelationMatrix from "@/components/charts/CorrelationMatrix";
import type { TimeSeriesDataPoint, CorrelationData } from "@/types/cpi";
import type { SeriesLookup } from "@/types/database";

/** The same 'city - item' wording the picker uses, so the two lists match. */
function seriesLabel(category: SeriesLookup): string {
  return `${category.city} - ${category.item}`;
}

interface ChartSelectorProps {
  categories: SeriesLookup[];
  firstData: TimeSeriesDataPoint[];
  title: string;
  dataFrequency: "Monthly" | "Quarterly";
}

const ChartSelector: React.FC<ChartSelectorProps> = ({
  categories,
  firstData,
  title,
  dataFrequency,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SeriesLookup[]>([
    categories[0],
  ]);
  const [chartData, setChartData] = useState<TimeSeriesDataPoint[][]>([
    firstData,
  ]);
  const [correlateOn, setCorrelateOn] = useState(false);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine API endpoint based on data frequency
  const apiEndpoint = dataFrequency === "Quarterly" ? "timeseriesqtl" : "timeseries";

  // Fetch time series data for a category
  const fetchTimeSeries = async (seriesId: string): Promise<TimeSeriesDataPoint[]> => {
    const response = await fetch(`/api/${apiEndpoint}/${seriesId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch time series data");
    }
    return response.json();
  };

  /**
   * Fetch correlation data.
   *
   * The route replies with a `{ data, categories }` envelope, not a bare
   * array. Treating the envelope as the array left `.length` undefined, so the
   * render guard below was never true and the correlation view stayed blank
   * however many times the button was pressed.
   *
   * A refusal here is ordinary rather than exceptional: series that overlap for
   * under a year cannot be correlated, and the route says so in `error`. That
   * message is worth showing, so it is returned rather than thrown.
   */
  const fetchCorrelation = async (
    data: TimeSeriesDataPoint[][]
  ): Promise<{ pairs: CorrelationData[]; error: string | null }> => {
    const response = await fetch("/api/correlate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        pairs: [],
        error: body?.error ?? "These series could not be correlated.",
      };
    }

    return { pairs: body?.data ?? [], error: null };
  };

  /** Recompute correlations for the current selection, or clear them. */
  const refreshCorrelation = async (nextChartData: TimeSeriesDataPoint[][]) => {
    if (nextChartData.length < 2) {
      setCorrelateOn(false);
      setCorrelationData([]);
      setCorrelationError(null);
      return;
    }

    const { pairs, error } = await fetchCorrelation(nextChartData);
    setCorrelationData(pairs);
    setCorrelationError(error);
  };

  // Handle category selection
  const handleSelect = async (category: SeriesLookup) => {
    const isAlreadySelected = selectedCategories.some(
      (c) => c.seriesid === category.seriesid
    );

    if (isAlreadySelected) {
      // Drop the deselected series and its data at the same position.
      // Truncating chartData to the new length instead removed whichever
      // series happened to be last, so every series after the deselected one
      // was plotted under the wrong label.
      const removedAt = selectedCategories.findIndex(
        (c) => c.seriesid === category.seriesid
      );
      if (removedAt <= 0) return; // the first series is fixed

      const newSelected = selectedCategories.filter((_, i) => i !== removedAt);
      const newChartData = chartData.filter((_, i) => i !== removedAt);

      setSelectedCategories(newSelected);
      setChartData(newChartData);
      await refreshCorrelation(newChartData);
    } else {
      // Add category
      setIsLoading(true);
      try {
        const newData = await fetchTimeSeries(category.seriesid);
        const newSelected = [...selectedCategories, category];
        const newChartData = [...chartData, newData];

        setSelectedCategories(newSelected);
        setChartData(newChartData);
        await refreshCorrelation(newChartData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Remove category by index
  const handleRemove = async (index: number) => {
    if (index === 0) return; // Don't allow removing first (fixed) category

    const newSelected = selectedCategories.filter((_, i) => i !== index);
    const newChartData = chartData.filter((_, i) => i !== index);

    setSelectedCategories(newSelected);
    setChartData(newChartData);
    await refreshCorrelation(newChartData);
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <Card>
        <CardContent className="p-4 bg-muted/40">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoading}
              >
                <span className="text-muted-foreground">
                  {isLoading ? "Loading..." : "Select CPI categories..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.some(
                      (c) => c.seriesid === category.seriesid
                    );
                    return (
                      <CommandItem
                        key={category.seriesid}
                        value={`${category.city} - ${category.item}`}
                        onSelect={() => handleSelect(category)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category.city} - {category.item}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected Categories Badges */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCategories.map((category, index) => (
                <Badge
                  key={category.seriesid}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  {category.city} - {category.item}
                  {index > 0 && (
                    <button
                      onClick={() => handleRemove(index)}
                      className="ml-2 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correlate toggle. Correlation needs at least two series to compare. */}
      {selectedCategories.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant={correlateOn ? "default" : "secondary"}
            onClick={() => setCorrelateOn((on) => !on)}
            aria-pressed={correlateOn}
          >
            {correlateOn ? "Hide correlation" : "Correlate"}
          </Button>
        </div>
      )}

      {/* Chart Display */}
      {chartData.length > 0 && (
        <div className="space-y-4">
          <MultiLineChart
            data={chartData}
            xaxis="publish_date"
            yaxis="cpi_value"
            chartTitle={null}
            height={550}
            marginTop={30}
            seriesNames={selectedCategories.map(seriesLabel)}
          />

          {correlateOn &&
            (correlationError ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    {correlationError}
                  </p>
                </CardContent>
              </Card>
            ) : correlationData.length > 0 ? (
              <CorrelationMatrix
                pairs={correlationData}
                labels={selectedCategories.map(seriesLabel)}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Working out the correlations...
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default ChartSelector;
