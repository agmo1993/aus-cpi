import client from "@/utils/dbClient";
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { seriesid } = params;

  const onlyLettersPattern = /^[A-Za-z0-9]+$/;

  if (!seriesid.match(onlyLettersPattern)) {
    return res
      .status(400)
      .json({ err: "No special characters and no numbers, please!" });
  }

  try {
    const data = await client.query(`
          SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, CONCAT (item, ' - ', City) AS "item"
          FROM auscpi.cpi_index
          WHERE seriesid = '${seriesid}';
      `);

    return NextResponse.json(data.rows);
  } catch (err) {
    console.error(err);
    // res.status(500).send("An error occurred");
  }
}
