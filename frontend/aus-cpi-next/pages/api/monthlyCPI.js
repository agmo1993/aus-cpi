const { Pool, Client, types } = require('pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/auscpidb'
 
const client = new Client({
  connectionString,
})

client.connect()


export default async function handler(req, res) {

  const data = await client.query("SELECT TO_CHAR(publish_date, 'mm-yyyy') as Date, cpi_value as CPI FROM auscpi.cpi_index_monthly WHERE item = 'All groups CPI, seasonally adjusted';");

  res.status(200).json({ name: data.rows })
}
