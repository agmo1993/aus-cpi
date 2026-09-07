"use client";

/**
 * ChartSelector Component
 * Multi-select autocomplete for CPI categories with chart visualization
 * and optional US (BLS) overlay for mapped monthly items.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_SERIES } from "@/lib/colors";
import MultiLineChart from "@/components/charts/MultiLineChart";
import CorrelationMatrix from "@/components/charts/CorrelationMatrix";
import type { TimeSeriesDataPoint, CorrelationData } from "@/types/cpi";
import type { SeriesLookup } from "@/types/database";

/** Client-side shape of GET /api/bls/crosswalk */
interface CrosswalkWithData {
  abs_item: string;
  bls_item_code: string;
  bls_item_name: string | null;
  match_quality: string;
  notes: string | null;
  has_data: boolean;
}

/** The same 'city - item' wording the picker uses, so the two lists match. */
function seriesLabel(category: SeriesLookup): string {
  return `${category.city} - ${category.item}`;
}

interface UsOverlay {
  itemCode: string;
  label: string;
  data: TimeSeriesDataPoint[];
  matchQuality: string;
  notes: string | null;
}

interface ChartSelectorProps {
  categories: SeriesLookup[];
  firstData: TimeSeriesDataPoint[];
  /** Optional initial series (e.g. deep-linked from the home page). */
  initialCategory?: SeriesLookup | null;
  dataFrequency: "Monthly" | "Quarterly";
}

const ChartSelector: React.FC<ChartSelectorProps> = ({
  categories,
  firstData,
  initialCategory = null,
  dataFrequency,
}) => {
  const seed = initialCategory ?? categories[0];
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SeriesLookup[]>(
    seed ? [seed] : []
  );
  /** ABS series only — parallel to selectedCategories. */
  const [chartData, setChartData] = useState<TimeSeriesDataPoint[][]>(
    seed ? [firstData] : []
  );
  const [correlateOn, setCorrelateOn] = useState(false);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [crosswalk, setCrosswalk] = useState<CrosswalkWithData | null>(null);
  const [usEnabled, setUsEnabled] = useState(false);
  const [usOverlay, setUsOverlay] = useState<UsOverlay | null>(null);
  const [usLoading, setUsLoading] = useState(false);

  const isMonthly = dataFrequency === "Monthly";
  const primaryItem = selectedCategories[0]?.item ?? null;

  const seriesCount =
    selectedCategories.length + (usEnabled && usOverlay ? 1 : 0);
  const atCap = seriesCount >= MAX_SERIES;
  const canRemoveFirst = selectedCategories.length > 1;

  const usAvailable =
    isMonthly &&
    crosswalk != null &&
    crosswalk.has_data &&
    Boolean(crosswalk.bls_item_code);

  const displayChartData = useMemo(() => {
    if (usEnabled && usOverlay) {
      return [...chartData, usOverlay.data];
    }
    return chartData;
  }, [chartData, usEnabled, usOverlay]);

  const displaySeriesNames = useMemo(() => {
    const absNames = selectedCategories.map(seriesLabel);
    if (usEnabled && usOverlay) {
      return [...absNames, usOverlay.label];
    }
    return absNames;
  }, [selectedCategories, usEnabled, usOverlay]);

  const apiEndpoint = dataFrequency === "Quarterly" ? "timeseriesqtl" : "timeseries";

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
  const refreshCorrelation = useCallback(
    async (nextChartData: TimeSeriesDataPoint[][]) => {
      if (nextChartData.length < 2) {
        setCorrelateOn(false);
        setCorrelationData([]);
        setCorrelationError(null);
        return;
      }

      const { pairs, error } = await fetchCorrelation(nextChartData);
      setCorrelationData(pairs);
      setCorrelationError(error);
    },
    []
  );

  const clearUsOverlay = useCallback(() => {
    setUsEnabled(false);
    setUsOverlay(null);
  }, []);

  // When the first selected ABS item changes, resolve crosswalk + has_data.
  useEffect(() => {
    if (!isMonthly || !primaryItem) {
      setCrosswalk(null);
      clearUsOverlay();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/bls/crosswalk?item=${encodeURIComponent(primaryItem)}`
        );
        if (!res.ok) {
          if (!cancelled) {
            setCrosswalk(null);
            clearUsOverlay();
          }
          return;
        }
        const data: CrosswalkWithData | null = await res.json();
        if (cancelled) return;

        setCrosswalk(data);

        // Clear US if the new primary item no longer maps (or has no data).
        if (!data || !data.has_data) {
          clearUsOverlay();
        } else if (
          usOverlay &&
          usOverlay.itemCode !== data.bls_item_code
        ) {
          // Mapped to a different BLS series — drop the old overlay.
          clearUsOverlay();
        }
      } catch (err) {
        console.error("Error fetching BLS crosswalk:", err);
        if (!cancelled) {
          setCrosswalk(null);
          clearUsOverlay();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // usOverlay intentionally omitted: we only react to primary item / frequency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryItem, isMonthly, clearUsOverlay]);

  // Keep correlation in sync with ABS + optional US overlay (including when US is cleared by crosswalk).
  useEffect(() => {
    void refreshCorrelation(displayChartData);
  }, [displayChartData, refreshCorrelation]);

  const handleToggleUs = async () => {
    if (usEnabled) {
      clearUsOverlay();
      return;
    }

    if (!crosswalk || !crosswalk.has_data) return;
    if (selectedCategories.length >= MAX_SERIES) return;

    setUsLoading(true);
    try {
      const res = await fetch(
        `/api/bls/timeseries/${encodeURIComponent(crosswalk.bls_item_code)}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch BLS time series");
      }
      const data: TimeSeriesDataPoint[] = await res.json();
      const blsName = crosswalk.bls_item_name ?? crosswalk.bls_item_code;
      const overlay: UsOverlay = {
        itemCode: crosswalk.bls_item_code,
        label: `US — ${blsName}`,
        data,
        matchQuality: crosswalk.match_quality,
        notes: crosswalk.notes,
      };
      setUsOverlay(overlay);
      setUsEnabled(true);
    } catch (error) {
      console.error("Error fetching BLS data:", error);
    } finally {
      setUsLoading(false);
    }
  };

  const handleSelect = async (category: SeriesLookup) => {
    const isAlreadySelected = selectedCategories.some(
      (c) => c.seriesid === category.seriesid
    );

    if (isAlreadySelected) {
      const removedAt = selectedCategories.findIndex(
        (c) => c.seriesid === category.seriesid
      );
      // Keep at least one series on the chart.
      if (removedAt < 0 || selectedCategories.length <= 1) return;
      if (removedAt === 0 && !canRemoveFirst) return;

      const newSelected = selectedCategories.filter((_, i) => i !== removedAt);
      const newChartData = chartData.filter((_, i) => i !== removedAt);

      setSelectedCategories(newSelected);
      setChartData(newChartData);
    } else {
      if (atCap) return;

      setIsLoading(true);
      try {
        const newData = await fetchTimeSeries(category.seriesid);
        const newSelected = [...selectedCategories, category];
        const newChartData = [...chartData, newData];

        setSelectedCategories(newSelected);
        setChartData(newChartData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemove = async (index: number) => {
    if (selectedCategories.length <= 1) return;
    if (index === 0 && !canRemoveFirst) return;

    const newSelected = selectedCategories.filter((_, i) => i !== index);
    const newChartData = chartData.filter((_, i) => i !== index);

    setSelectedCategories(newSelected);
    setChartData(newChartData);
  };

  const truncateNotes = (notes: string | null | undefined, max = 80) => {
    if (!notes) return null;
    if (notes.length <= max) return notes;
    return `${notes.slice(0, max - 1)}…`;
  };

  const canAddUs =
    usAvailable &&
    !usEnabled &&
    selectedCategories.length < MAX_SERIES &&
    !usLoading;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 p-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select CPI categories"
              className="w-full justify-between"
              disabled={isLoading}
            >
              <span className="text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : atCap
                    ? `Up to ${MAX_SERIES} series selected`
                    : "Select CPI categories..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {categories.map((category) => {
                  const isSelected = selectedCategories.some(
                    (c) => c.seriesid === category.seriesid
                  );
                  const disabledAdd = !isSelected && atCap;
                  return (
                    <CommandItem
                      key={category.seriesid}
                      value={`${category.city} - ${category.item}`}
                      disabled={disabledAdd || (isSelected && selectedCategories.length <= 1)}
                      onSelect={() => handleSelect(category)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                        aria-hidden="true"
                      />
                      {category.city} - {category.item}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCategories.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category, index) => {
                const label = seriesLabel(category);
                const removable = selectedCategories.length > 1;
                return (
                  <Badge
                    key={category.seriesid}
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {label}
                    {removable ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="ml-2 hover:text-destructive"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="sr-only">
                        {" "}
                        (keep at least one series on the chart)
                      </span>
                    )}
                  </Badge>
                );
              })}
              {usEnabled && usOverlay && (
                <Badge variant="outline" className="px-3 py-1">
                  {usOverlay.label}
                  <button
                    type="button"
                    onClick={() => handleToggleUs()}
                    className="ml-2 hover:text-destructive"
                    aria-label={`Remove ${usOverlay.label}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
            </div>

            {usAvailable && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant={usEnabled ? "secondary" : "outline"}
                  onClick={handleToggleUs}
                  disabled={usLoading || (!usEnabled && !canAddUs)}
                  aria-pressed={usEnabled}
                >
                  {usLoading
                    ? "Loading US…"
                    : usEnabled
                      ? "Remove US"
                      : "Add US (BLS)"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  US city average · match: {crosswalk?.match_quality}
                  {truncateNotes(crosswalk?.notes)
                    ? ` · ${truncateNotes(crosswalk?.notes)}`
                    : ""}
                  {!usEnabled && selectedCategories.length >= MAX_SERIES
                    ? " · remove an ABS series to free a slot"
                    : ""}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Compare up to {MAX_SERIES} series. At least one series must stay
              selected so the chart has something to plot.
            </p>
          </div>
        )}
      </div>

      {displayChartData.length > 1 && (
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

      {displayChartData.length > 0 && (
        <div className="space-y-4">
          <MultiLineChart
            data={displayChartData}
            xaxis="publish_date"
            yaxis="cpi_value"
            chartTitle={null}
            height={550}
            marginTop={30}
            seriesNames={displaySeriesNames}
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
                labels={displaySeriesNames}
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
