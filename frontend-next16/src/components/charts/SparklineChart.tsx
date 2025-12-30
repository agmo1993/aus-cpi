"use client";

/**
 * SparklineChart Component
 * Small inline D3.js line chart for table cells
 */

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { SparklineChartProps } from "@/types";

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = 70,
  height = 30,
  color = "hsl(var(--success))",
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Define the scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.publish_date))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => parseFloat(d.cpi_value)) || 0,
        d3.max(data, (d) => parseFloat(d.cpi_value)) || 100,
      ])
      .range([height, 0]);

    // Create the line generator
    const line = d3
      .line<{ publish_date: string; cpi_value: string }>()
      .x((d) => (xScale(d.publish_date) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(parseFloat(d.cpi_value)));

    // Draw the line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, height, width, color]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default SparklineChart;
