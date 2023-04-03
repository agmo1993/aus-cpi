import DLayout from "components/Layout";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Image from "next/image";


const contributors = [
    {
      name: 'Abdul Rehman Mohammad',
      role: 'Software Engineer',
      avatarUrl: '/images/arm.jpeg',
    },
];

export default function About(){
    return (
        <DLayout>
            <Box sx={styles.chartPanel}>
            <Box sx={styles.section}>
                <Typography variant="h4">
                About
                </Typography>
                <Typography variant="body1">
                    AusCPI is a powerful dashboard that offers users a range of tools to analyze and visualize consumer price index (CPI) data from the Australian Bureau of Statistics. The dashboard is designed to help users monitor and explore trends in the prices of various goods and services, including housing, healthcare, education, transportation, and food. With its user-friendly interface and interactive data visualization tools, AusCPI provides a convenient and accessible platform for anyone interested in understanding the state of Australia's economy. By presenting CPI data in an easy-to-understand format, AusCPI allows users to gain valuable insights and make informed decisions based on the latest economic trends.                
                </Typography>
                <br />
                <Typography variant="body1">
                    Interpreting macroeconomic data from the ABS is daunting, but it's crucial for people to understand. The data shapes economic policies and impacts the cost of living. The CPI measures inflation, affecting spending, investment, and borrowing decisions. A basic understanding of macroeconomic data is necessary to make informed decisions that impact daily lives.
                </Typography>
            </Box>
            <Box sx={styles.section}>
                <Typography variant="h4">
                Contributors
                </Typography>
                <Grid container spacing={3}>
                {contributors.map((contributor) => (
                    <Grid item xs={12} sm={4} key={contributor.name}>
                    <div>
                        <Image src={contributor.avatarUrl} alt={contributor.name} width={160} height={200} />
                        <Typography variant="h6">
                        {contributor.name}
                        </Typography>
                        <Typography variant="subtitle1">
                        {contributor.role}
                        </Typography>
                    </div>
                    </Grid>
                ))}
                </Grid>
            </Box>
            </Box>
        </DLayout>
    );
};

const styles = {
    chartPanel: {
      backgroundColor: "white",
      height: ["320px", "320px", "320px", "90vh", "90vh"],
      margin: "40px",
    },
    section : {
        padding : '2%',
    }
};