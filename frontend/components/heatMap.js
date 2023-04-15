import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import colors from "styles/colors";
import Box from "@mui/material/Box";


const HeatCorrelation = ({ chartData }) => {
  const svgRef = useRef();
  const width = 400;
  const height = 400;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    var corrValues = chartData.data.map((x) => x.corr);

    var myGroups = chartData.categories;
    var myVars = chartData.categories;

    // Build X scales and axis:
    var x = d3.scaleBand().range([0, width]).domain(myGroups).padding(0.01);

    var xAxis = svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    xAxis
      .selectAll("path")
      .style("stroke", colors.secondary)
      .style("stroke-width", "3")
      .style("opacity", "0");

    xAxis
      .selectAll("text")
      .style("font-size", "12px")
      .attr("transform", "rotate(45)")
      .style("color", colors.secondary)
      .style("text-anchor", "start")
      .style("opacity", function () {
        if (myGroups.length > 10) {
          return "0";
        }
      });

    // Build X scales and axis:
    var y = d3.scaleBand().range([height, 0]).domain(myVars).padding(0.01);

    var yAxis = svg
      .append("g")
      .attr("transform", "translate(" + width + ",0)")
      .call(d3.axisRight(y));

    yAxis
      .selectAll("path")
      .style("stroke", colors.secondary)
      .style("stroke-width", "3")
      .style("opacity", "0");

    yAxis
      .selectAll("text")
      .style("font-size", "12px")
      .style("color", colors.secondary)
      .style("opacity", function () {
        if (myGroups.length > 10) {
          return "0";
        }
      });

    const axisTicks = svg.selectAll(".tick").nodes();

    // access last axis ticks on each axis
    const lastElement = axisTicks[axisTicks.length - 1];
    const midElement = axisTicks[0];

    // set opacity to 0 for both
    d3.select(lastElement)
      .style("opacity", 0);

    d3.select(midElement)
      .style("opacity", 0);

    // Build color scale
    var myColor = d3
      .scaleLinear()
      .range(["#f7fcf0", "#207e66"])
      .domain([Math.min(...corrValues), Math.max(...corrValues)]);

    svg
      .selectAll()
      .data(
        chartData.data.filter(function (d) {
          return d.corr !== 1;
        }),
        function (d) {
          return d.itemX + ":" + d.itemY;
        }
      )
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return x(d.itemX);
      })
      .attr("y", function (d) {
        return y(d.itemY);
      })
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", function (d) {
        if (d.corr !== 1) {
          return myColor(d.corr);
        } else {
          return "white";
        }
      })
      .on("mouseover", function (event, d) {
        if (d.corr !== 1) {
          // Show tooltip on mouseover
          d3.select(this)
            .attr("stroke", colors.secondary)
            .attr("stroke-width", 2);
          d3.select("#tooltip")
            .style("opacity", 1)
            .style("background-color", colors.primary)
            .style("border", "solid")
            .style("border-color", colors.secondary)
            .style("border-width", "2px")
            .style("border-radius", "1px")
            .style("padding", "5px")
            .html(
              `${d.itemX} & ${
                d.itemY
              }</br>Pearson Correlation: ${d.corr.toFixed(2)}`
            )
            .style("font-size", "12px")
            .style("left", `${event.pageX - 200}px`)
            .style("top", `${event.pageY- 200}px`);
        }
      })
      .on("mouseout", function (event, d) {
        if (d.corr !== 1) {
          // Hide tooltip on mouseout
          d3.select(this).attr("stroke", "none");
          d3.select("#tooltip").style("opacity", 0);
        }
      });

  }, [chartData]);

  return (
    <Box
      position="absolute"
      display="flex"
      justifyContent="center"
      alignItems="center"
      id="box"
      zIndex={2}
      style={{ width: "82vw", backgroundColor : "#ECEEE6e0", opacity : 1, height : '70vh' }}
    >
      <svg ref={svgRef} width={width + 200} height={height + 200}></svg>
      <div id="tooltip" style={{ opacity: 0, position: "absolute", zIndex: 3} } />
    </Box>
  );
};

export default HeatCorrelation;
