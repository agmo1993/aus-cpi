import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import colors from 'styles/colors';


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
            align: "left"
        },
        chart : {
            height : height,
            backgroundColor: '#ffffff00',
            marginTop : marginTop
        },
        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
          },
        credits: {
            enabled: false
        },
        tooltip: {
            formatter: function() {
                return `CPI on ${this.x}: <b> ${this.y} </b>`;
            }
        },
        yAxis: {
            title: {
                text: yaxis
            }
            },
        xAxis: {
            categories: data.map( e => e[xaxis])
            },
        series: [{
            data: data.map( e => parseFloat(e[yaxis])),
            color: colors.secondary
        }]
    }
    return (
        <div>
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
            />
        </div>
        );
}
export default HighChartsLine;