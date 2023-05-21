"use client"
import Box from "@mui/material/Box";
import colors from "@/styles/colors";
import { useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import HighChartsMultiLine from "@/components/highChartsMultiLine";
// import HeatCorrelation from "@/components/heatMap";
import Button from "@mui/material/Button";
import HighChartsBar from "./highChartsBar";

const renderChip = (index, window) => {
    if (window > 800 && index > 3) {
        return false;
    } else if (window < 800 && index > 0) {
        return false;
    } else {
        return true;
    }
};

export default function ChartUIMonthly({ categories, firstData}) {
    const fixedOptions = [categories[0]];
    const [value, setValue] = useState([...fixedOptions]);
    const [prevValue, setPrevValue] = useState(null);
    const [chartData, setChartData] = useState([firstData]);
    const [correlateOn, setcorrelateOn] = useState(false);
    const [heatData, setHeatData] = useState([]);
    const [width, setWidth] = useState(1200);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/timeseries/${value[value.length - 1].seriesid
                }`
            );
            const data = await response.json();
            setChartData([...chartData, data]);

            const heatData = await Promise.resolve(
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/correlate`, {
                    method: "POST",
                    body: JSON.stringify([...chartData, data]),
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then((res) => res.json())
            );

            console.log(heatData);
            setHeatData(heatData);
        };

        const justCorrelateData = async (data) => {
            const heatData = await Promise.resolve(
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/correlate`, {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then((res) => res.json())
            );

            setHeatData(heatData);
        };

        setWidth(window.innerWidth);

        if (value) {
            if (prevValue && prevValue.length > value.length) {
                setChartData(chartData.slice(0, -1));
                if (value.length === 1) {
                    setcorrelateOn(false);
                } else {
                    justCorrelateData(chartData.slice(0, -1));
                }
            } else if (value.length > 1) {
                fetchData();
            }
        }
    }, [value]);

    return (
        <>
            <Autocomplete
                multiple
                id="fixed-tags-demo"
                value={value}
                onChange={(event, newValue) => {
                    setPrevValue(value);
                    setValue([
                        ...fixedOptions,
                        ...newValue.filter(
                            (option) => fixedOptions.indexOf(option) === -1
                        ),
                    ]);
                }}
                options={categories}
                getOptionLabel={(option) => `${option.city} - ${option.item}`}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map(
                        (option, index) =>
                            renderChip(index, width) && (
                                <Chip
                                    label={`${option.city} - ${option.item}`}
                                    {...getTagProps({ index })}
                                    key={option.item}
                                    disabled={fixedOptions.indexOf(option) !== -1}
                                    sx={{
                                        backgroundColor: "white",
                                    }}
                                />
                            )
                    )
                }
                style={{
                    width: "100%",
                    backgroundColor: colors.danger,
                    padding: "1%",
                    borderColor: "white",
                }}
                renderInput={(params) => {
                    params.InputProps = {
                        ...params.InputProps,
                        style: { maxHeight: "60px" },
                    };
                    return (
                        <TextField
                            {...params}
                            label="CPI categories"
                            InputLabelProps={{
                                style: { color: "white" },
                            }}
                        />
                    );
                }}
            />
            <Box
                display="flex"
                justifyContent="right"
                alignItems="right"
                sx={styles.correlateButton}
            >
                {value.length > 1 && (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            if (correlateOn) {
                                setcorrelateOn(false);
                            } else {
                                setcorrelateOn(true);
                            }
                        }}
                    >
                        {correlateOn ? "Chart" : "Correlate"}
                    </Button>
                )}
            </Box>
            <div position="relative">
                {chartData.length > 0 &&
                    (!correlateOn ? (
                        <HighChartsMultiLine
                            data={chartData}
                            xaxis="publish_date"
                            yaxis="cpi_value"
                            chartTitle={null}
                            height={550}
                            marginTop={30}
                        />
                    ) : (
                        <>
                            <HighChartsMultiLine
                                data={chartData}
                                xaxis="publish_date"
                                yaxis="cpi_value"
                                chartTitle={null}
                                height={550}
                                marginTop={30}
                            />
                            <HighChartsBar data={heatData} scale="linear"/>
                        </>
                    ))}
            </div>
        </>
    )
}

const styles = {
    chartPanel: {
      backgroundColor: "white",
      height: ["70vh", "70vh", "85vh", "85vh", "85vh"],
      margin: ["20px", "20px", "40px", "40px", "40px"],
    },
    correlateButton: {
      height: "3vh",
      marginTop: "5px",
      marginRight: "5px",
    },
  };
  