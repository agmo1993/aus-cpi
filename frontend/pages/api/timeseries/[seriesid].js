import client from "utils/dbClient";

export default async function handler(req, res) {
  const { seriesid } = req.query;

  const onlyLettersPattern = /^[A-Za-z0-9]+$/;

  if (!seriesid.match(onlyLettersPattern)) {
    return res
      .status(400)
      .json({ err: "No special characters and no numbers, please!" });
  }

  try {
    const data = await client.query(`
      SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, item
      FROM auscpi.cpi_index_monthly
      WHERE seriesid = '${seriesid}';
    `);

    res.status(200).json(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}
