"use client";

/**
 * LineChart Component
 * Single-line time series chart using shadcn/Recharts
 */

import React from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { LineChartProps } from "@/types";

const LineChart: React.FC<LineChartProps> = ({
  data,
  xaxis,
  yaxis,
  chartTitle,
  height = 400,
  marginTop = 10,
  className = "",
}) => {
  // Transform data for Recharts
  const chartData = data.map((item: any) => ({
    [xaxis]: item[xaxis],
    [yaxis]: parseFloat(item[yaxis] as string),
  }));

  // Chart configuration
  const chartConfig = {
    [yaxis]: {
      label: "CPI Value",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <Card className={className}>
      {chartTitle && (
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <RechartsLineChart
            data={chartData}
            margin={{ top: marginTop, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xaxis}
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [`${value}`, "CPI"]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey={yaxis}
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--secondary))", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LineChart;
