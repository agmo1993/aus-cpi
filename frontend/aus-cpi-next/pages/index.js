import DLayout from 'components/Layout';
import HighChartsLine from 'components/highChartsLine';
import Box from '@mui/material/Box';
import colors from 'styles/colors';
import FiveCard from 'components/fiveCard';
import Grid from '@mui/material/Grid';


export async function getStaticProps() {
 
  const [response1, response2, response3] = await Promise.all([
    fetch('http://localhost:3000/api/monthlyCPI'),
    fetch('http://localhost:3000/api/topIncreaseMonthly'),
    fetch('http://localhost:3000/api/topIncreaseYearly'),
  ]);

  const [ dataGraph, dataBottom, dataBottom2 ] = await Promise.all( [ response1.json(), response2.json(), response3.json() ]);

  for (let i = 0; i < dataBottom.name.length; i++){
    let timeSeries = await fetch(`http://localhost:3000/api/timeseries/${dataBottom.name[i].seriesid}`);
    let timeSeriesJson = await timeSeries.json();
    dataBottom.name[i].timeseries = timeSeriesJson;
  }

  for (let i = 0; i < dataBottom2.name.length; i++){
    let timeSeries = await fetch(`http://localhost:3000/api/timeseries/${dataBottom2.name[i].seriesid}`);
    let timeSeriesJson = await timeSeries.json();
    dataBottom2.name[i].timeseries = timeSeriesJson;
  }

  return {
      props: { 
        graphData: dataGraph.name, 
        dataBottom : dataBottom.name,
        dataBottom2 : dataBottom2.name 
      },
  };
}

export default function Home({ graphData, dataBottom, dataBottom2 }) {

  return (
    <DLayout>
      <Box sx={styles.chartPanel}>
      <div style={{
                        textAlign : 'left',
                        padding : '0.5%',
                        backgroundColor : colors.secondary,

                    }}>
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
      <Grid item xs={12} md={6} >
        <FiveCard data={dataBottom} dataChart={graphData} />
      </Grid>
      <Grid item xs={12} md={6}>
        <FiveCard data={dataBottom2} dataChart={graphData}/>
      </Grid>
      </Grid>
    </DLayout>
  )
}

const styles = {
  chartPanel : {
    backgroundColor : 'white',
    height : ['320px', '320px', '320px', '55vh', '55vh'],
    margin : '40px',  
  }
}
