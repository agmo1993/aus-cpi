"use client";

/**
 * MultiLineChart Component
 * Multi-series time series chart using Highcharts (for complex visualizations)
 */

import React, { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { chartColorArray } from "@/lib/colors";
import type { MultiLineChartProps } from "@/types";

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  xaxis,
  yaxis,
  chartTitle = null,
  height = 500,
  marginTop = 20,
  className = "",
}) => {
  const options = useMemo<Highcharts.Options>(() => {
    if (!data || data.length === 0) {
      return {} as Highcharts.Options;
    }

    return {
      title: {
        text: chartTitle || undefined,
        useHTML: true,
        align: "left",
      },
      chart: {
        backgroundColor: "transparent",
        marginTop,
        height,
      },
      legend: {
        enabled: false,
      },
      exporting: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      tooltip: {
        formatter: function (this: any) {
          return `Index of ${this.series.name} on ${this.x}: <b>${this.y}</b>`;
        },
      },
      yAxis: {
        title: {
          text: yaxis,
        },
      },
      xAxis: {
        categories: data[0]?.map((e: any) => e[xaxis] as string) || [],
      },
      plotOptions: {
        line: {
          marker: {
            lineWidth: 1,
            radius: 2,
          },
        },
      },
      series: data.map((seriesData, index) => ({
        type: "line" as const,
        data: seriesData.map((e: any) => parseFloat(e[yaxis] as string)),
        color: chartColorArray[index % chartColorArray.length],
        name: String(seriesData[0]?.item || `Series ${index + 1}`),
      })),
    };
  }, [data, xaxis, yaxis, chartTitle, height, marginTop]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: "100%", width: "100%" } }}
      />
    </div>
  );
};

export default MultiLineChart;
