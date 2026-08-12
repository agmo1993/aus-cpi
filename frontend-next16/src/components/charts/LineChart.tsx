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
      color: "hsl(var(--chart-1))",
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
            {/*
              A CPI index sits near 100 and moves by a point or two, so a
              zero-based axis squashes the whole series into a flat line. Fit
              the axis to the data instead: this is an index, not a magnitude,
              and nothing here is proportional to the distance from zero.
            */}
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tickLine={false}
              axisLine={false}
              width={44}
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
            {/*
              Animation off. Recharts draws the line in by animating
              stroke-dasharray from "0px <length>", so until the animation runs
              the path is a zero-length dash and the line is invisible. That
              leaves the chart blank for anyone whose animations do not run:
              reduced-motion users, print, and screenshots. The draw-in carries
              no information, so there is nothing to trade away by dropping it.
            */}
            <Line
              type="monotone"
              dataKey={yaxis}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LineChart;
