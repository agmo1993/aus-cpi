import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import colors from "styles/colors";

/**
 * A component to render a line chart based on the data
 * provided
 *
 *
 * @component
 * @example
 *
 *
 * const lineData = [{ time: '2021-8-1', count: 303237 },
 *                    { time: '2021-8-2', count: 308311 } ,
 *                    { time: '2021-8-3', count: 311661 } ];
 *
 * const sentiment = true;
 *
 * return (
 *       <HighChartsExample
 *           data={lineData}
 *           xaxis="time"
 *           yaxis={sentiment ? "sentiment" : "count"}
 *           chartTitle={null}
 *           height={240}
 *           marginTop={10}
 *       />
 * )
 */
function HighChartsLine({ data, xaxis, yaxis, chartTitle, height, marginTop }) {
  const options = {
    title: {
      text: chartTitle,
      useHTML: true,
      align: "left",
    },
    chart: {
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
        return `CPI on ${this.x}: <b> ${this.y} </b>`;
      },
    },
    yAxis: {
      title: {
        text: yaxis,
      },
    },
    xAxis: {
      categories: data.map((e) => e[xaxis]),
    },
    plotOptions: {
      line: {
        marker: {
          fillColor: colors.primary, // Set the fill color of the markers to red
          lineColor: colors.danger, // Set the line color of the markers to black
          lineWidth: 1, // Set the line width of the markers to 1
          radius: 2, // Set the radius of the markers to 4
        },
      },
    },
    series: [
      {
        data: data.map((e) => parseFloat(e[yaxis])),
        color: colors.secondary,
      },
    ],
  };
  return (
    <div style={{ width: "80vw", height : "55vh"}}>
      <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ style: { height: "80%" } }}/>
    </div>
  );
}
export default HighChartsLine;
