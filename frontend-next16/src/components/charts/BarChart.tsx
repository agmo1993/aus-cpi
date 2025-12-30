"use client";

/**
 * BarChart Component
 * Correlation visualization using shadcn/Recharts
 */

import React from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartColorArray } from "@/lib/colors";
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
            <Bar dataKey="correlation" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColorArray[index % chartColorArray.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BarChart;
