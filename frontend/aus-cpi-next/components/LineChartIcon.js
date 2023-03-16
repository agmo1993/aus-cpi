import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import colors from 'styles/colors';

const LineChart = ({ data, width = 70, height = 30 }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Define the scales and axes
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.publish_date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => parseFloat(d.cpi_value)), d3.max(data, d => parseFloat(d.cpi_value))])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Create the line element
    const line = d3.line()
      .x(d => xScale(d.publish_date) + xScale.bandwidth() / 2)
      .y(d => yScale(parseFloat(d.cpi_value)));

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("path, line")
      .style("display", "none");

    svg.append("g")
      .call(yAxis)
      .selectAll("path, line")
      .style("display", "none");

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors.success)
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, height, width]);

  return (
    <svg ref={svgRef} width={width} height={height}>
    </svg>
  );
};

export default LineChart;



