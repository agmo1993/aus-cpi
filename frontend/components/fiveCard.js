import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import colors from "styles/colors";
import LineChart from "./LineChartIcon";

export default function FiveCard({ data, heading }) {
  return (
    <TableContainer
      sx={{ backgroundColor: "white", marginLeft: "10%", maxWidth: "80%" }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "0.5%",
          backgroundColor: colors.secondary,
          color: "white",
          fontSize: "20px",
        }}
      >
        <b>{heading}</b>
      </div>
      <Table aria-label="simple table">
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.seriesid}>
              <TableCell align="center" sx={styles.tableCell}>
                {row.item}
              </TableCell>
              <TableCell sx={styles.tableCell} align="center">
                <LineChart data={row.timeseries} />
              </TableCell>
              <TableCell sx={styles.tableCell} align="center">
                {row.current_value}
              </TableCell>
              <TableCell sx={styles.tableCell} align="center">
                {parseFloat(row.percentage_change).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const styles = {
  tableCell: {
    padding: "2.5px",
    color: colors.danger,
  },
};
