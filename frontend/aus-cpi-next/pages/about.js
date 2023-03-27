import DLayout from "components/Layout";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';


const contributors = [
    {
      name: 'John Doe',
      role: 'Software Engineer',
      avatarUrl: 'https://via.placeholder.com/150',
    },
    {
      name: 'Jane Smith',
      role: 'UI/UX Designer',
      avatarUrl: 'https://via.placeholder.com/150',
    },
    {
      name: 'Bob Johnson',
      role: 'Product Manager',
      avatarUrl: 'https://via.placeholder.com/150',
    },
];

export default function About(){
    return (
        <DLayout>
            <Box sx={styles.chartPanel}>
            <Box sx={styles.section}>
                <Typography variant="h4">
                Heading
                </Typography>
                <Typography variant="body1">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat, nisi eu convallis luctus, ex lorem mollis sapien, eget euismod elit ipsum a augue. Duis at leo scelerisque, faucibus nulla vel, interdum sem. Donec hendrerit, urna vitae imperdiet tempus, tortor velit fringilla enim, ac suscipit ipsum nibh ac arcu. Nulla facilisi. Mauris at tristique quam. Donec sit amet ipsum lacinia, molestie lacus sed, imperdiet nulla. Sed pretium purus vel erat interdum, ut venenatis turpis rhoncus.
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
                        <img src={contributor.avatarUrl} alt={contributor.name} />
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
        padding : '5%',
    }
};