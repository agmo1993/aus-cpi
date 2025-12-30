"use client";

/**
 * HeatmapChart Component
 * Correlation heatmap using D3.js
 */

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeatmapChartProps } from "@/types";

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  chartData,
  width: propWidth,
  height: propHeight,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: propWidth || (isMobile ? 300 : 500),
        height: propHeight || (isMobile ? 300 : 500),
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!svgRef.current || !chartData || !chartData.data || chartData.data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 100, bottom: 100, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const corrValues = chartData.data.map((x) => x.corr);
    const categories = chartData.categories;

    // Build scales
    const xScale = d3.scaleBand().range([0, innerWidth]).domain(categories).padding(0.01);
    const yScale = d3.scaleBand().range([innerHeight, 0]).domain(categories).padding(0.01);

    // X axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    xAxis.selectAll("path").style("opacity", "0");
    xAxis
      .selectAll("text")
      .style("font-size", "10px")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .style("opacity", categories.length > 10 ? "0" : "1");

    // Y axis
    const yAxis = g
      .append("g")
      .attr("transform", `translate(${innerWidth},0)`)
      .call(d3.axisRight(yScale));

    yAxis.selectAll("path").style("opacity", "0");
    yAxis
      .selectAll("text")
      .style("font-size", "10px")
      .style("opacity", categories.length > 10 ? "0" : "1");

    // Hide tick lines
    svg.selectAll(".tick line").style("opacity", "0");

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .range(["hsl(var(--muted))", "hsl(var(--secondary))"])
      .domain([Math.min(...corrValues), Math.max(...corrValues)]);

    // Draw heatmap cells
    g.selectAll("rect")
      .data(chartData.data.filter((d) => d.corr !== 1))
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.itemX) || 0)
      .attr("y", (d) => yScale(d.itemY) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => colorScale(d.corr))
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "hsl(var(--secondary))").attr("stroke-width", 2);

        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style("opacity", "1")
            .html(
              `<strong>${d.itemX} & ${d.itemY}</strong><br/>Pearson Correlation: ${d.corr.toFixed(3)}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        }
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "none");
        if (tooltipRef.current) {
          d3.select(tooltipRef.current).style("opacity", "0");
        }
      });
  }, [chartData, dimensions]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">Correlation Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <div className="relative">
          <svg ref={svgRef} width={dimensions.width + 200} height={dimensions.height + 200} />
          <div
            ref={tooltipRef}
            className="absolute opacity-0 bg-card border-2 border-secondary rounded px-3 py-2 text-sm pointer-events-none z-10"
            style={{ transition: "opacity 0.2s" }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;
