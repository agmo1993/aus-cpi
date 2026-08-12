"use client";

/**
 * BarChart Component
 * Correlation visualization using shadcn/Recharts
 */

import React from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { BarChartProps } from "@/types";

const BarChart: React.FC<BarChartProps> = ({
  data,
  scale = "linear",
  height = 500,
  className = "",
}) => {
  // Transform correlation data for Recharts
  const chartData = data.map((item) => ({
    name: `${'itemY' in item ? item.itemY : ''} vs ${'itemX' in item ? item.itemX : ''}`,
    correlation: 'corr' in item ? item.corr : 0,
  }));

  // Chart configuration
  const chartConfig = {
    correlation: {
      label: "Correlation Coefficient",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">Correlation</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <RechartsBarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis
              domain={[-1, 1]}
              tickLine={false}
              axisLine={false}
              className="text-xs"
              label={{ value: 'Correlation Coefficient', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [Number(value).toFixed(3), "Correlation"]}
                />
              }
            />
            {/*
              Correlation runs -1 to 1 around a meaningful zero, so the bars
              carry a diverging encoding: one hue per direction. Coloring them
              by their position in the list instead would tie color to rank,
              which repaints every bar as soon as the filter changes.
            */}
            <Bar dataKey="correlation" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    Number(entry.correlation) < 0
                      ? "hsl(var(--chart-3))"
                      : "hsl(var(--chart-1))"
                  }
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BarChart;
