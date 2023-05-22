import pandas as pd
import psycopg2
import os
import logging
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

def main():
    logging.info("Starting program to insert cpi data in table")
    logging.info("Reading data file aus_cpi_timeseries.csv")

    # read the first row of the CSV file
    header = pd.read_csv('./data/aus_cpi_timeseries_monthly.csv', nrows=1).columns
    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv('./data/aus_cpi_timeseries_monthly.csv', names=header)

    # Connect to a PostgreSQL database
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        port=5432,
        database="auscpidb",
        user= os.environ['DB_USER'],
        password=os.environ['DB_PASS']
    )

    df = df[df['Date'] == '2023-03-01']

    logging.info("Inserting rows into table cpi_index")

    # Insert the rows into the table
    for index, row in df.iterrows():
        try:
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO auscpi.cpi_index_monthly (publish_date, seriesid, cpi_value, item, city)
                VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;
            ''', (row['Date'], row['Series ID'], row['CPI Value'], row['Item'], row['Location']))
            conn.commit()
            logging.info(f"Inserted {row['Series ID']} for {row['Date']}")
        except Exception as e:
            conn.rollback()
            logging.error(e)

    logging.info("Refreshing Materialized Views")
    # refresh materialized views
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_quarterly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_yearly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_monthly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_yearly_base2017;")

    conn.close()

if __name__ == "__main__":
    main()