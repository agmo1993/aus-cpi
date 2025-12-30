"use client";

/**
 * TopMoversCard Component
 * Displays top CPI movers in a table with sparklines
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
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-center text-xl">{heading}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="bg-secondary text-secondary-foreground p-3">
        <CardTitle className="text-center text-xl font-bold">
          {heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="text-center font-semibold">Item</TableHead>
              <TableHead className="text-center font-semibold">Trend</TableHead>
              <TableHead className="text-center font-semibold">Value</TableHead>
              <TableHead className="text-center font-semibold">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={`${heading}-${index}`}
                className="hover:bg-muted/50"
              >
                <TableCell className="text-center py-2 px-2 text-sm text-foreground">
                  {row.item}
                </TableCell>
                <TableCell className="text-center py-2 px-2">
                  {row.timeseries && row.timeseries.length > 0 ? (
                    <div className="flex justify-center">
                      <SparklineChart
                        data={row.timeseries}
                        width={70}
                        height={30}
                        color="hsl(var(--success))"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No data</span>
                  )}
                </TableCell>
                <TableCell className="text-center py-2 px-2 text-sm text-foreground">
                  {parseFloat(row.current_value).toFixed(1)}
                </TableCell>
                <TableCell className="text-center py-2 px-2 text-sm font-semibold text-foreground">
                  {parseFloat(row.pct_change).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopMoversCard;
