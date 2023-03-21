import DLayout from "components/Layout";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import { useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import HighChartsMultiLine from "components/highChartsMultiLine";

export async function getStaticProps() {
  const monthlyCategories = await Promise.resolve(
    fetch("http://localhost:3000/api/lookupMonthly").then((res) => res.json())
  );

  const firstData = await Promise.resolve(
    fetch(
      `http://localhost:3000/api/timeseries/${monthlyCategories[0].seriesid}`
    ).then((res) => res.json())
  );

  return {
    props: {
      monthlyCategories: monthlyCategories,
      firstData: firstData,
    },
  };
}

export default function Category({ monthlyCategories, firstData }) {
  const fixedOptions = [monthlyCategories[0]];
  const [value, setValue] = useState([...fixedOptions]);
  const [prevValue, setPrevValue] = useState(null);
  const [chartData, setChartData] = useState([firstData]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `http://localhost:3000/api/timeseries/${
          value[value.length - 1].seriesid
        }`
      );
      const data = await response.json();
      setChartData([...chartData, data]);
    };

    if (value) {
      if (prevValue && prevValue.length > value.length) {
        setChartData(chartData.slice(0, -1));
      } else {
        fetchData();
      }
    }
  }, [value]);

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
          <b>Plot and compare CPI by category</b>
        </div>
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
          options={monthlyCategories}
          getOptionLabel={(option) => option.item}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                label={option.item}
                {...getTagProps({ index })}
                disabled={fixedOptions.indexOf(option) !== -1}
                sx={{
                  backgroundColor: "white",
                }}
              />
            ))
          }
          style={{
            width: "100%",
            backgroundColor: colors.danger,
            padding: "1%",
            borderColor: "white",
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="CPI categories"
              InputLabelProps={{
                style: { color: "white" },
              }}
            />
          )}
        />
        <HighChartsMultiLine
          data={chartData}
          xaxis="publish_date"
          yaxis="cpi_value"
          chartTitle={null}
          height={580}
          marginTop={30}
        />
      </Box>
    </DLayout>
  );
}

const styles = {
  chartPanel: {
    backgroundColor: "white",
    height: ["320px", "320px", "320px", "90vh", "90vh"],
    margin: "40px",
  },
};
