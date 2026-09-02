"use client";

/**
 * Compare one CPI series with one industry GVA series.
 *
 * GVA is quarterly $ millions; CPI is a monthly index. Both are taken at
 * quarter-ending months and rebased to 100 at the first shared quarter, so
 * they can share one axis. Year-ended % change is the other reading.
 */

import React, { useEffect, useMemo, useState } from "react";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { cn } from "@/lib/utils";
import type { TimeSeriesDataPoint } from "@/types";
import type { SeriesLookup } from "@/types/database";
import { gvaLabel, type GvaSeries } from "@/lib/gva-label";

type Mode = "index" | "yoy";

const QUARTER_MONTHS = new Set(["03", "06", "09", "12"]);

function monthPart(key: string): string {
  return key.split("-")[0];
}

function quarterPoints(series: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
  return series.filter((row) => QUARTER_MONTHS.has(monthPart(row.publish_date)));
}

function byDate(series: TimeSeriesDataPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of series) {
    const value = parseFloat(row.cpi_value);
    if (!Number.isNaN(value)) map.set(row.publish_date, value);
  }
  return map;
}

function sharedDates(a: TimeSeriesDataPoint[], b: TimeSeriesDataPoint[]): string[] {
  const other = new Set(b.map((row) => row.publish_date));
  return a
    .map((row) => row.publish_date)
    .filter((date) => other.has(date));
}

function asSeries(
  dates: string[],
  values: Map<string, number>,
  item: string,
  transform: (date: string, value: number, dates: string[], values: Map<string, number>) => number | null
): TimeSeriesDataPoint[] {
  return dates
    .map((date) => {
      const value = values.get(date);
      if (value === undefined) return null;
      const next = transform(date, value, dates, values);
      if (next === null || Number.isNaN(next)) return null;
      return { publish_date: date, cpi_value: next.toFixed(2), item };
    })
    .filter((row): row is TimeSeriesDataPoint => row !== null);
}

interface CpiGvaCompareProps {
  cpiSeries: SeriesLookup[];
  gvaSeries: GvaSeries[];
  defaultCpi: TimeSeriesDataPoint[];
  defaultGva: TimeSeriesDataPoint[];
  defaultCpiId: string;
  defaultGvaId: string;
}

const CpiGvaCompare: React.FC<CpiGvaCompareProps> = ({
  cpiSeries,
  gvaSeries,
  defaultCpi,
  defaultGva,
  defaultCpiId,
  defaultGvaId,
}) => {
  const [cpiId, setCpiId] = useState(defaultCpiId);
  const [gvaId, setGvaId] = useState(defaultGvaId);
  const [cpiData, setCpiData] = useState(defaultCpi);
  const [gvaData, setGvaData] = useState(defaultGva);
  const [mode, setMode] = useState<Mode>("index");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [cpiRes, gvaRes] = await Promise.all([
          fetch(`/api/timeseries/${cpiId}`),
          fetch(`/api/gva/${gvaId}`),
        ]);
        if (!cpiRes.ok || !gvaRes.ok) return;
        const [cpiJson, gvaJson] = await Promise.all([cpiRes.json(), gvaRes.json()]);
        if (!cancelled) {
          setCpiData(cpiJson);
          setGvaData(gvaJson);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (cpiId !== defaultCpiId || gvaId !== defaultGvaId) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [cpiId, gvaId, defaultCpiId, defaultGvaId]);

  const cpiMeta = cpiSeries.find((row) => row.seriesid === cpiId);
  const gvaMeta = gvaSeries.find((row) => row.seriesid === gvaId);
  const cpiName = cpiMeta ? `${cpiMeta.city} - ${cpiMeta.item}` : "CPI";
  const gvaName = gvaMeta ? gvaLabel(gvaMeta) : "GVA";

  const { chartData, yLabel, emptyReason } = useMemo(() => {
    const cpiQ = quarterPoints(cpiData);
    const dates = sharedDates(cpiQ, gvaData);
    if (dates.length < 2) {
      return {
        chartData: [] as TimeSeriesDataPoint[][],
        yLabel: "",
        emptyReason: "These series do not overlap on enough quarters to plot.",
      };
    }

    const cpiMap = byDate(cpiQ);
    const gvaMap = byDate(gvaData);

    if (mode === "index") {
      const t0 = dates[0];
      const cpi0 = cpiMap.get(t0);
      const gva0 = gvaMap.get(t0);
      if (!cpi0 || !gva0) {
        return { chartData: [], yLabel: "", emptyReason: "Missing values at the start of the overlap." };
      }
      return {
        chartData: [
          asSeries(dates, cpiMap, cpiName, (_d, v) => (100 * v) / cpi0),
          asSeries(dates, gvaMap, gvaName, (_d, v) => (100 * v) / gva0),
        ],
        yLabel: `Index (100 = ${t0})`,
        emptyReason: "",
      };
    }

    const yoy = (
      date: string,
      value: number,
      allDates: string[],
      values: Map<string, number>
    ) => {
      const index = allDates.indexOf(date);
      if (index < 4) return null;
      const prior = values.get(allDates[index - 4]);
      if (!prior) return null;
      return ((value / prior) - 1) * 100;
    };

    const cpiYoy = asSeries(dates, cpiMap, cpiName, yoy);
    const gvaYoy = asSeries(dates, gvaMap, gvaName, yoy);
    if (cpiYoy.length < 2 || gvaYoy.length < 2) {
      return {
        chartData: [],
        yLabel: "",
        emptyReason: "Need at least five overlapping quarters for year-ended change.",
      };
    }
    return {
      chartData: [cpiYoy, gvaYoy],
      yLabel: "Year-ended % change",
      emptyReason: "",
    };
  }, [cpiData, gvaData, mode, cpiName, gvaName]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm min-w-0">
          <span className="font-medium">CPI series</span>
          <select
            value={cpiId}
            onChange={(event) => setCpiId(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {cpiSeries.map((row) => (
              <option key={row.seriesid} value={row.seriesid}>
                {row.city} - {row.item}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm min-w-0">
          <span className="font-medium">Industry GVA</span>
          <select
            value={gvaId}
            onChange={(event) => setGvaId(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {gvaSeries.map((row) => (
              <option key={row.seriesid} value={row.seriesid}>
                {gvaLabel(row)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap rounded-lg border p-0.5 w-fit" role="group" aria-label="Scale">
        {(
          [
            ["index", "Rebased to 100"],
            ["yoy", "Year-ended %"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading series…</p>
      ) : emptyReason ? (
        <p className="text-sm text-muted-foreground">{emptyReason}</p>
      ) : (
        <MultiLineChart
          data={chartData}
          xaxis="publish_date"
          yaxis="cpi_value"
          seriesNames={[cpiName, `${gvaName} (GVA)`]}
          height={420}
        />
      )}
      <p className="text-xs text-muted-foreground">
        CPI is sampled at March, June, September and December so it matches GVA.
        {mode === "index"
          ? " Both series equal 100 at the first overlapping quarter."
          : " Year-ended change is this quarter versus the same quarter a year earlier."}{" "}
        {yLabel}
      </p>
    </div>
  );
};

export default CpiGvaCompare;
