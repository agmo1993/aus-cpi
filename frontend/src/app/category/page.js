import '../globals.css'
import colors from "@/styles/colors";
import client from "@/utils/dbClient";
import ChartUIMonthly from '@/components/chartUIMonthly';

export default async function City() {
    const monthlyCategories = await Promise.resolve(
        client
            .query(
                `
    SELECT seriesid, item, City
    FROM auscpi.seriesid_lookup
    WHERE data_frequency = 'Monthly'
    ORDER BY array_position(\'{\"All groups CPI\"}\', item) ASC, city DESC;
  `
            )
            .then((data) => data.rows)
    );

    const firstData = await Promise.resolve(
        client
            .query(
                `
    SELECT TO_CHAR(publish_date, 'mm-yyyy') as publish_date, cpi_value, CONCAT (item, ' - ', City) AS "item"
    FROM auscpi.cpi_index_monthly
    WHERE seriesid = '${monthlyCategories[0].seriesid}';
  `
            )
            .then((data) => data.rows)
    );

    return (
        <div>
            <div className="chart-panel-ui">
                <div
                    style={{
                        textAlign: "center",
                        padding: "0.5%",
                        backgroundColor: colors.secondary,
                        color: "white",
                        fontSize: "22px",
                    }}
                >
                    <b>Plot and compare CPI by Category</b>
                </div>
                <ChartUIMonthly categories={monthlyCategories} firstData={firstData} />
            </div>
        </div>
    );
}