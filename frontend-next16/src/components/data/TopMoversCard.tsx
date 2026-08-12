"use client";

/**
 * TopMoversCard Component
 * The largest CPI movers, with a sparkline per row.
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SparklineChart from "@/components/charts/SparklineChart";
import type { TopMover } from "@/types";

interface TopMoversCardProps {
  data: TopMover[];
  heading: string;
  className?: string;
}

const TopMoversCard: React.FC<TopMoversCardProps> = ({
  data,
  heading,
  className = "",
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{heading}</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {!data || data.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No data available.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 font-medium">Item</TableHead>
                <TableHead className="w-[90px] font-medium">Trend</TableHead>
                <TableHead className="text-right font-medium">Index</TableHead>
                <TableHead className="pr-6 text-right font-medium">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const change = parseFloat(row.pct_change);

                return (
                  <TableRow key={`${heading}-${index}`} className="hover:bg-muted/50">
                    <TableCell className="py-2 pl-6 text-sm">{row.item}</TableCell>
                    <TableCell className="py-2">
                      {row.timeseries && row.timeseries.length > 0 ? (
                        // Recessive: the change column carries the meaning, the
                        // sparkline only carries the shape.
                        <SparklineChart
                          data={row.timeseries}
                          width={70}
                          height={30}
                          className="text-muted-foreground"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">n/a</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">
                      {parseFloat(row.current_value).toFixed(1)}
                    </TableCell>
                    <TableCell
                      className={`py-2 pr-6 text-right text-sm font-medium tabular-nums ${
                        change > 0 ? "text-danger" : change < 0 ? "text-success" : ""
                      }`}
                    >
                      {change > 0 ? "+" : ""}
                      {change.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopMoversCard;
