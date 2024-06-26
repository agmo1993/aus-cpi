import DLayout from "components/Layout";
import Box from "@mui/material/Box";
import colors from "styles/colors";
import { useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import HighChartsMultiLine from "components/highChartsMultiLine";
import HeatCorrelation from "@/components/heatMap";
import Button from "@mui/material/Button";
// import client from "utils/dbClient";
import kv from '@vercel/kv';

const renderChip = (index, window) => {
  if (window > 800 && index > 3) {
    return false;
  } else if (window < 800 && index > 0) {
    return false;
  } else {
    return true;
  }
};

export async function getServerSideProps() {
  const quarterlyCategories = await Promise.resolve(
    client
      .query(
        `
    SELECT seriesid, item, City
    FROM auscpi.seriesid_lookup
    WHERE data_frequency = 'Quarterly'
    ORDER BY array_position(\'{\"All groups CPI\"}\', item) ASC, city DESC;
  `
      )
      .then((data) => data.rows)
  );

  const firstData = await Promise.resolve(
    client
      .query(
        `
    SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, CONCAT (item, ' - ', City) AS "item"
    FROM auscpi.cpi_index
    WHERE seriesid = '${quarterlyCategories[0].seriesid}';
  `
      )
      .then((data) => data.rows)
  );

  // const quarterlyCategories = await kv.get('quarterlyCategoriesCity');
  // const firstData = await kv.get('firstDataCity');

  // await kv.set('quarterlyCategoriesCity', quarterlyCategories);
  // await kv.set('firstDataCity', firstData);

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
  const [correlateOn, setcorrelateOn] = useState(false);
  const [heatData, setHeatData] = useState([]);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/timeseriesqtl/${
          value[value.length - 1].seriesid
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
                <HeatCorrelation chartData={heatData} />
              </>
            ))}
        </div>
      </Box>
    </DLayout>
  );
}

const styles = {
  chartPanel: {
    backgroundColor: "white",
    height: ["80vh", "80vh", "85vh", "90vh", "90vh"],
    margin: ["20px", "20px", "40px", "40px", "40px"],
  },
  correlateButton: {
    height: "3vh",
    marginTop: "5px",
    marginRight: "5px",
  },
};
