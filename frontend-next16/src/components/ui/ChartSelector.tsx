"use client";

/**
 * ChartSelector Component
 * Multi-select autocomplete for CPI categories with chart visualization
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import MultiLineChart from "@/components/charts/MultiLineChart";
import BarChart from "@/components/charts/BarChart";
import type { TimeSeriesDataPoint, CorrelationData } from "@/types/cpi";
import type { SeriesLookup } from "@/types/database";

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

  // Fetch correlation data
  const fetchCorrelation = async (data: TimeSeriesDataPoint[][]): Promise<CorrelationData[]> => {
    const response = await fetch("/api/correlate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch correlation data");
    }
    return response.json();
  };

  // Handle category selection
  const handleSelect = async (category: SeriesLookup) => {
    const isAlreadySelected = selectedCategories.some(
      (c) => c.seriesid === category.seriesid
    );

    if (isAlreadySelected) {
      // Remove category
      const newSelected = selectedCategories.filter(
        (c) => c.seriesid !== category.seriesid
      );
      const newChartData = chartData.slice(0, newSelected.length);

      setSelectedCategories(newSelected);
      setChartData(newChartData);

      // Update correlation if more than 1 series remains
      if (newSelected.length > 1) {
        const newCorrelation = await fetchCorrelation(newChartData);
        setCorrelationData(newCorrelation);
      } else {
        setCorrelateOn(false);
        setCorrelationData([]);
      }
    } else {
      // Add category
      setIsLoading(true);
      try {
        const newData = await fetchTimeSeries(category.seriesid);
        const newSelected = [...selectedCategories, category];
        const newChartData = [...chartData, newData];

        setSelectedCategories(newSelected);
        setChartData(newChartData);

        // Fetch correlation if more than 1 series
        if (newSelected.length > 1) {
          const newCorrelation = await fetchCorrelation(newChartData);
          setCorrelationData(newCorrelation);
        }
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

    if (newSelected.length > 1) {
      const newCorrelation = await fetchCorrelation(newChartData);
      setCorrelationData(newCorrelation);
    } else {
      setCorrelateOn(false);
      setCorrelationData([]);
    }
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

      {/* Correlate Toggle */}
      {selectedCategories.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant={correlateOn ? "default" : "secondary"}
            onClick={() => setCorrelateOn(!correlateOn)}
          >
            {correlateOn ? "Chart" : "Correlate"}
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
          />

          {/* Correlation Bar Chart */}
          {correlateOn && correlationData.length > 0 && (
            <BarChart data={correlationData} scale="linear" />
          )}
        </div>
      )}
    </div>
  );
};

export default ChartSelector;
