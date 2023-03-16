import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import colors from 'styles/colors';
import LineChart from './LineChartIcon';

function createData(
  name,
  calories,
  fat,
  carbs,
  protein
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

export default function FiveCard({ data, dataChart }) {
  return (
    <TableContainer sx={{ backgroundColor : 'white', marginLeft : '10%', maxWidth: '80%' }}>
      <Table aria-label="simple table">
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.seriesid}
            >
              <TableCell align="center">
                {row.item}
              </TableCell>
              <TableCell align="center"><LineChart data={row.timeseries}/></TableCell>
              <TableCell align="center">{parseFloat(row.percentage_change).toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}