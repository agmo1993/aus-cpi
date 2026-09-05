/**
 * OECD inflation compare — monthly headline CPI YoY across countries.
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OecdCompareChart from "@/components/oecd/OecdCompareChart";
import {
  listOecdCountries,
  getOecdLatestYoy,
  getOecdYoyTimeseries,
} from "@/lib/queries";
import { formatMonth } from "@/lib/format";
import { monthOrdinal } from "@/lib/timeseries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DEFAULT_CHART_CODES = [
  "AUS",
  "USA",
  "GBR",
  "DEU",
  "CAN",
  "KOR",
  "OECD",
];

export default async function OecdPage() {
  const countries = await listOecdCountries();
  const codes = countries.map((c) => c.country_code);
  const [latest, series] = await Promise.all([
    getOecdLatestYoy(),
    getOecdYoyTimeseries(codes),
  ]);

  const asOfKey = latest.reduce<string | undefined>((max, row) => {
    if (!max) return row.period;
    return monthOrdinal(row.period) > monthOrdinal(max) ? row.period : max;
  }, undefined);
  const asOfLabel = formatMonth(asOfKey);

  const defaultCodes = DEFAULT_CHART_CODES.filter((c) => codes.includes(c));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          OECD inflation
        </h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Monthly headline CPI year-on-year from the OECD SDMX Prices dataflow.
          Australia ABS remains the source of truth for AusCPI category and city
          detail
          {asOfLabel ? `; OECD figures as of ${asOfLabel}` : ""}.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              Latest YoY by country
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest available month per country (OECD releases lag ABS).
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Latest month</TableHead>
                  <TableHead className="text-right">YoY %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.map((row) => {
                  const isAus = row.country_code === "AUS";
                  return (
                    <TableRow
                      key={row.country_code}
                      className={cn(isAus && "bg-primary/5 font-medium")}
                      data-state={isAus ? "selected" : undefined}
                    >
                      <TableCell>
                        <span className="tabular-nums text-muted-foreground mr-2">
                          {row.country_code}
                        </span>
                        {row.country_name}
                        {isAus ? (
                          <span className="ml-2 text-xs text-primary">
                            (ABS detail on Overview)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatMonth(row.period) || row.period}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number.isFinite(row.value)
                          ? row.value.toFixed(1)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              YoY inflation over time
            </h2>
            <p className="text-sm text-muted-foreground">
              Select countries to compare. Default set highlights Australia
              against major peers and the OECD aggregate when available.
            </p>
          </div>
          <OecdCompareChart
            countries={countries}
            series={series}
            defaultCodes={defaultCodes}
            height={360}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground max-w-[65ch]">
        Source: OECD SDMX DF_PRICES_ALL (monthly headline CPI, growth over one
        year). Country latest months can differ because OECD updates lag
        national statistical offices. For Australian category and capital-city
        detail, use AusCPI&apos;s ABS series on Overview and Categories.
      </p>
    </div>
  );
}
