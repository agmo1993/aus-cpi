import DLayout from "components/Layout";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import { useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import HighChartsMultiLine from "components/highChartsMultiLine";

export async function getStaticProps() {
  const quarterlyCategories = await Promise.resolve(
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lookupQuarterly`).then(
      (res) => res.json()
    )
  );

  const firstData = await Promise.resolve(
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/timeseriesqtl/${quarterlyCategories[0].seriesid}`
    ).then((res) => res.json())
  );

  return {
    props: {
      quarterlyCategories: quarterlyCategories,
      firstData: firstData,
    },
  };
}

export default function City({ quarterlyCategories, firstData }) {
  const fixedOptions = [quarterlyCategories[0]];
  const [value, setValue] = useState([...fixedOptions]);
  const [prevValue, setPrevValue] = useState(null);
  const [chartData, setChartData] = useState([firstData]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/timeseriesqtl/${
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
          <b>Plot and compare CPI by Category and City</b>
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
          options={quarterlyCategories}
          getOptionLabel={(option) => `${option.city} - ${option.item}`}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                label={`${option.city} - ${option.item}`}
                {...getTagProps({ index })}
                key={option.item}
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
