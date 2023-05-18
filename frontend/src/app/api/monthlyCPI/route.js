import client from "@/utils/dbClient";
import { NextResponse } from 'next/server';

export async function GET(req) {
  const data = await client.query(
    "SELECT TO_CHAR(publish_date, 'mm-yyyy') as Date, cpi_value as CPI FROM auscpi.cpi_index_monthly WHERE seriesid = 'A128478317T';"
  );

  return NextResponse.json( { name: data.rows });
}
