import client from "utils/dbClient";

export default async function handler(req, res) {
  const data = await client.query(`
    SELECT seriesid, item, City
    FROM auscpi.seriesid_lookup
    WHERE data_frequency = 'Quarterly';
  `);

  res.status(200).json(data.rows);
}
