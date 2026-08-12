"use client";

/**
 * MultiLineChart Component
 * Multi-series time series chart using Highcharts (for complex visualizations)
 */

import React, { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { getSeriesColor } from "@/lib/colors";
import { useColorScheme } from "@/lib/use-color-scheme";
import { alignOnUnion, type SeriesRow } from "@/lib/timeseries";
import type { MultiLineChartProps } from "@/types";

/**
 * Highcharts draws its own chrome and cannot read the CSS custom properties,
 * so the surrounding theme has to be handed to it as literal colours. Without
 * this it keeps its stock light-mode defaults: near-black labels and white
 * gridlines, which on the dark surface leaves the labels unreadable and the
 * grid shouting over the data.
 */
const CHROME = {
  light: {
    text: "#5A625D",
    grid: "#E2E6E3",
    tooltipBg: "#FCFDFC",
    tooltipText: "#0F1412",
  },
  dark: {
    text: "#9AA5A0",
    grid: "#2A302D",
    tooltipBg: "#1B211E",
    tooltipText: "#F0F3F1",
  },
} as const;

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  xaxis,
  yaxis,
  chartTitle = null,
  height = 500,
  marginTop = 20,
  className = "",
  seriesNames,
}) => {
  const scheme = useColorScheme();

  const options = useMemo<Highcharts.Options>(() => {
    if (!data || data.length === 0) {
      return {} as Highcharts.Options;
    }

    const chrome = CHROME[scheme];

    // Series start on different dates, so plot every one against a shared
    // axis of all months covered rather than against the first series'.
    const { months, values } = alignOnUnion(
      data as unknown as SeriesRow[][],
      xaxis,
      yaxis
    );

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
      // Identity must never be carried by color alone. With several series on
      // one axis the legend is the only thing naming them outside a hover.
      legend: {
        enabled: data.length > 1,
        align: "left",
        verticalAlign: "bottom",
        itemStyle: { fontWeight: "400", color: chrome.text },
        itemHoverStyle: { color: chrome.tooltipText },
      },
      exporting: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      tooltip: {
        backgroundColor: chrome.tooltipBg,
        borderColor: chrome.grid,
        style: { color: chrome.tooltipText },
        formatter: function (this: any) {
          return `Index of ${this.series.name} on ${this.x}: <b>${this.y}</b>`;
        },
      },
      yAxis: {
        // `yaxis` is the data key ("cpi_value"), not a label. Printing it put a
        // database column name on the axis.
        title: {
          text: "Index",
          style: { color: chrome.text },
        },
        gridLineColor: chrome.grid,
        lineColor: chrome.grid,
        tickColor: chrome.grid,
        labels: { style: { color: chrome.text } },
      },
      xAxis: {
        categories: months,
        gridLineColor: chrome.grid,
        lineColor: chrome.grid,
        tickColor: chrome.grid,
        labels: { style: { color: chrome.text } },
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
        data: values[index],
        color: getSeriesColor(index, scheme),
        name:
          seriesNames?.[index] ||
          String(seriesData[0]?.item || `Series ${index + 1}`),
      })),
    };
  }, [data, xaxis, yaxis, chartTitle, height, marginTop, scheme, seriesNames]);

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
