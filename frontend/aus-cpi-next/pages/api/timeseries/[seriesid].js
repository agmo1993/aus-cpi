const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/auscpidb'
 
const client = new Client({
  connectionString,
})

client.connect()

export default async function handler(req, res) {
    const { seriesid } = req.query;

    const data = await client.query(`
        SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value
        FROM auscpi.cpi_index_monthly
        WHERE seriesid = '${seriesid}';
    `);

    res.status(200).json(data.rows)
}