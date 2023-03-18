const { Client } = require('pg');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/auscpidb'
 
const client = new Client({
  connectionString,
})
client.connect()


export default async function handler(req, res) {
  const data = await client.query(`
    SELECT seriesid, item, city, data_frequency
    FROM auscpi.seriesid_lookup
    WHERE data_frequency = 'Monthly'
  `);

  res.status(200).json(data.rows)
}
