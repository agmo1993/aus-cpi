import DLayout from "components/Layout";
import HighChartsLine from "components/highChartsLine";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import FiveCard from "components/fiveCard";
import Grid from "@mui/material/Grid";
import client from "utils/dbClient";

export async function getServerSideProps() {
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

  const fetchTimeSeries = async (name) => {
    const timeSeries = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/timeseries/${name.seriesid}`
    ).then((res) => res.json());
    return { ...name, timeseries: timeSeries };
  };

  const dataBottomWithTimeSeries = await Promise.all(
    dataBottom.map(fetchTimeSeries)
  );
  const dataBottom2WithTimeSeries = await Promise.all(
    dataBottom2.map(fetchTimeSeries)
  );

  return {
    props: {
      graphData: dataGraph,
      dataBottom: dataBottomWithTimeSeries,
      dataBottom2: dataBottom2WithTimeSeries,
    },
  };
}

export default function Home({ graphData, dataBottom, dataBottom2 }) {
  return (
    <DLayout>
      <Box sx={styles.chartPanel}>
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
          data={graphData}
          xaxis="date"
          yaxis="cpi"
          chartTitle={null}
          height={400}
          marginTop={10}
        />
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FiveCard data={dataBottom} heading="Top monthly gainers" />
        </Grid>
        <Grid item xs={12} md={6}>
          <FiveCard data={dataBottom2} heading="Top yearly risers" />
        </Grid>
      </Grid>
    </DLayout>
  );
}

const styles = {
  chartPanel: {
    backgroundColor: "white",
    height: ["55vh", "55vh", "55vh", "55vh", "55vh"],
    margin: ["20px", "20px", "40px", "40px", "40px"],
  },
};
