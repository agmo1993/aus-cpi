import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Box from "@mui/material/Box";
import linePlotColors from "@/styles/linePlotColors";

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

function HighChartsBar({ data, scale }) {
  var colorsList = Object.keys(linePlotColors).map(
    (key) => linePlotColors[key]
  );

  console.log(colorsList);
  const options = {
    chart: {
      type: 'column',
      backgroundColor: "#ECEEE6e0"
    },
    exporting: {
      enabled: false
    },
    title: {
      text: 'Correlation',
      useHTML: true,
      align: "center",
      margin: 40
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.x}: ${Highcharts.numberFormat(this.y, 2)} </b>`;
      }
    },
    yAxis: {
      type: scale,
      minorTickInterval: 0.1,
      title: {
        text: 'Correlation Coefficient'
      },
      min: -1,
      max: 1
    },
    xAxis: {
      categories: data.data.map(e => `${e['itemY']} vs ${e['itemX']}`)
    },
    series: [{
      data: data.data.map((e, i) => ({ y : e['corr'], color: colorsList[i] }))
    }]
  }

  return (
    <Box
      position="absolute"
      display="flex"
      justifyContent="center"
      alignItems="center"
      id="box"
      zIndex={2}
      style={{ width: "80%", opacity: 1, height: "65%" }}
    >
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: "90%", width: "80%"} }}
      />
    </Box>
  );
}
export default HighChartsBar;