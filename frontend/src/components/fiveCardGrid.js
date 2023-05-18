"use client"
import Grid from "@mui/material/Grid";
import FiveCard from "@/components/fiveCard";


export const FiveCardGrid = ({ dataBottom, dataBottom2 }) => {
    return (
        <>
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <FiveCard data={dataBottom} heading="Top monthly gainers" />
            </Grid>
            <Grid item xs={12} md={6}>
                <FiveCard data={dataBottom2} heading="Top yearly risers" />
            </Grid>
        </Grid>
        </>
    )
};