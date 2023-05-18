import '../globals.css'
import colors from "@/styles/colors";
import client from "@/utils/dbClient";
import ChartUI from '@/components/chartUI';

export default async function City() {
    const quarterlyCategories = await Promise.resolve(
        client
            .query(
                `
    SELECT seriesid, item, City
    FROM auscpi.seriesid_lookup
    WHERE data_frequency = 'Quarterly'
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
    FROM auscpi.cpi_index
    WHERE seriesid = '${quarterlyCategories[0].seriesid}';
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
                    <b>Plot and compare CPI by Category and City</b>
                </div>
                <ChartUI categories={quarterlyCategories} firstData={firstData} />
            </div>
        </div>
    );
}