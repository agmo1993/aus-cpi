const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/auscpidb'
 
const client = new Client({
  connectionString,
})

client.connect()


export default async function handler(req, res) {
  const data = await client.query(`
    SELECT current_value, previous_value, percentage_change, seriesid, item
    FROM auscpi.cpi_pct_monthly
    order by publish_date desc, percentage_change desc limit 5;
  `);

  res.status(200).json({ name: data.rows })
}
