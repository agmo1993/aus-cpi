import './globals.css'
import HighChartsLine from "@/components/highChartsLine";
import colors from "@/styles/colors";
import client from "@/utils/dbClient";
import { FiveCardGrid } from "@/components/fiveCardGrid";

const fetchTimeSeries = async (name) => {
  const timeSeries = await client
    .query(
      `
    SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
    FROM auscpi.cpi_index_monthly
    WHERE seriesid = '${name.seriesid}';
  `
    )
    .then((data) => data.rows);
  return { ...name, timeseries: timeSeries };
};

export default async function Home() {
  const [dataGraph, dataBottom, dataBottom2] = await Promise.all([
    client
      .query(
        "SELECT TO_CHAR(publish_date, 'mm-yyyy') as Date, cpi_value as CPI FROM auscpi.cpi_index_monthly WHERE seriesid = 'A128478317T';"
      )
      .then((data) => data.rows),
    client
      .query(
        `
      SELECT current_value, previous_value, percentage_change, seriesid, item
      FROM auscpi.cpi_pct_monthly
      order by publish_date desc, percentage_change desc limit 5;      `
      )
      .then((data) => data.rows),
    client
      .query(
        `
      SELECT current_value, previous_value, percentage_change, seriesid, item
      FROM auscpi.cpi_pct_yearly_base2017
      order by publish_date desc, percentage_change desc limit 5;  `
      )
      .then((data) => data.rows),
  ]);

  const dataBottomWithTimeSeries = await Promise.all(
    dataBottom.map(fetchTimeSeries)
  );
  const dataBottom2WithTimeSeries = await Promise.all(
    dataBottom2.map(fetchTimeSeries)
  );

  return (
    <div>
      <div className="chart-panel">
        <div
          style={{
            textAlign: "center",
            padding: "0.5%",
            backgroundColor: colors.secondary,
            color: "white",
            fontSize: "22px",
          }}
        >
          <b>Consumer Price Index | </b> <small>Monthly base 2017</small>
        </div>
          <HighChartsLine
            data={dataGraph}
            xaxis="date"
            yaxis="cpi"
            chartTitle={null}
            height={400}
            marginTop={10}
          />
      </div>
      <FiveCardGrid dataBottom={dataBottomWithTimeSeries} dataBottom2={dataBottom2WithTimeSeries}/>
    </div>
  )
}