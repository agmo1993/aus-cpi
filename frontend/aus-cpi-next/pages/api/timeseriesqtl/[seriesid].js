import client from 'utils/dbClient';

export default async function handler(req, res) {
    const { seriesid } = req.query;

    const data = await client.query(`
        SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, CONCAT (item, ' - ', City) AS "item"
        FROM auscpi.cpi_index
        WHERE seriesid = '${seriesid}';
    `);

    res.status(200).json(data.rows)
}