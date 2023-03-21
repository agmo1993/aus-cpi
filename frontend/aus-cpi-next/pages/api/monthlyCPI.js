import client from "utils/dbClient";

export default async function handler(req, res) {
  const data = await client.query(
    "SELECT TO_CHAR(publish_date, 'mm-yyyy') as Date, cpi_value as CPI FROM auscpi.cpi_index_monthly WHERE item = 'All groups CPI, seasonally adjusted';"
  );

  res.status(200).json({ name: data.rows });
}
