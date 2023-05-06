import DLayout from "components/Layout";
import HighChartsLine from "components/highChartsLine";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import FiveCard from "components/fiveCard";
import Grid from "@mui/material/Grid";

export async function getServerSideProps() {
  const [dataGraph, dataBottom, dataBottom2] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/monthlyCPI`).then((res) =>
      res.json()
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topIncreaseMonthly`).then(
      (res) => res.json()
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/topIncreaseYearly`).then(
      (res) => res.json()
    ),
  ]);

  const fetchTimeSeries = async (name) => {
    const timeSeries = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/timeseries/${name.seriesid}`
    ).then((res) => res.json());
    return { ...name, timeseries: timeSeries };
  };

  const dataBottomWithTimeSeries = await Promise.all(
    dataBottom.name.map(fetchTimeSeries)
  );
  const dataBottom2WithTimeSeries = await Promise.all(
    dataBottom2.name.map(fetchTimeSeries)
  );

  return {
    props: {
      graphData: dataGraph.name,
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
