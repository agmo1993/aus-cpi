import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

/**
 * A component to render the a histogram plot representing the distribution
 * of values on the map plotted above
 *
 * @component
 * @example
 *
 *
 * const placeData = [{hc-key: '1', value: 25945},
 *                    {hc-key: '2', value: 22333},
 *                    {hc-key: '3', value: 14131} ];
 *
 * return (
 *    <HighChartsBar
 *       data={langData}
 *       xaxis="language"
 *       yaxis="count"
 *       chartTitle={null}
 *       scale="logarithmic"
 *      />
 * )
 */

function HighChartsBar({ data, xaxis, yaxis, chartTitle, scale }) {
  const options = {
    chart: {
      type: "column",
      height: "210px",
    },
    exporting: {
      enabled: false,
    },
    title: {
      text: chartTitle,
      useHTML: true,
      align: "left",
      margin: 40,
    },
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      formatter: function () {
        return `Posts in ${this.x}: <b> ${Highcharts.numberFormat(
          this.y,
          0
        )} </b>`;
      },
    },
    yAxis: {
      type: scale,
      minorTickInterval: 0.1,
      title: {
        text: "Count (log scale)",
      },
      max: 1000000,
    },
    xAxis: {
      categories: data.map((e) => e[xaxis]),
    },
    series: [
      {
        data: data.map((e) => e[yaxis]),
      },
    ],
  };

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
export default HighChartsBar;
