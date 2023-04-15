import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import linePlotColors from "styles/linePlotColors";
import colors from "styles/colors";
import Box from "@mui/material/Box";

function HighChartsMultiLine({
  data,
  xaxis,
  yaxis,
  chartTitle,
  height,
  marginTop,
}) {
  var colorsList = Object.keys(linePlotColors).map(
    (key) => linePlotColors[key]
  );
  const options = {
    title: {
      text: chartTitle,
      useHTML: true,
      align: "left",
    },
    chart: {
      height: height,
      backgroundColor: "#ffffff00",
      marginTop: marginTop,
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
      formatter: function () {
        return `Index of ${this.series.name} on ${this.x}: <b> ${this.y} </b>`;
      },
    },
    yAxis: {
      title: {
        text: yaxis,
      },
    },
    xAxis: {
      categories: data[0].map((e) => e[xaxis]),
    },
    plotOptions: {
      line: {
        marker: {
          fillColor: colors.primary, // Set the fill color of the markers to red
          lineWidth: 1, // Set the line width of the markers to 1
          radius: 2, // Set the radius of the markers to 4
        },
      },
    },
    series: data.map((x, index) => ({
      data: x.map((e) => parseFloat(e[yaxis])),
      color: colorsList[index],
      name: x[0].item,
    })),
  };
  return (
    <Box position="absolute" zIndex={1} style={{ width: "80vw" }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </Box>
  );
}
export default HighChartsMultiLine;
