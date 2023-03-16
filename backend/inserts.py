import pandas as pd
import psycopg2
import os
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)

def main():
    logging.info("Starting program to insert cpi data in table")
    logging.info("Reading data file aus_cpi_timeseries.csv")

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv('./data/aus_cpi_timeseries.csv')

    # Connect to a PostgreSQL database
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="auscpidb",
        user="postgres",
        password="postgres"
    )
    cur = conn.cursor()

    logging.info("Inserting rows into table cpi_index")
    # Insert the rows into the table
    for index, row in df.iterrows():
        try:
            cur.execute('''
                INSERT INTO auscpi.cpi_index (publish_date, seriesid, cpi_value, item, city)
                VALUES (%s, %s, %s, %s, %s)
            ''', (row['Date'], row['Series ID'], row['CPI Value'], row['Item'], row['Location']))
            conn.commit()
        except Exception as e:
            logging.error(f"{row} failed to insert")

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv('./data/aus_cpi_timeseries_monthly.csv')

    logging.info("Inserting rows into table cpi_index_monthly")
    # Insert the rows into the table
    for index, row in df.iterrows():
        try:
            cur.execute('''
                INSERT INTO auscpi.cpi_index_monthly (publish_date, seriesid, cpi_value, item, city)
                VALUES (%s, %s, %s, %s, %s)
            ''', (row['Date'], row['Series ID'], row['CPI Value'], row['Item'], row['Location']))
            conn.commit()
        except Exception as e:
            logging.error(f"{row} failed to insert")

    logging.info("Refreshing Materialized Views")
    # refresh materialized views
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_quarterly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_yearly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_monthly;")
    cur.execute("REFRESH MATERIALIZED VIEW auscpi.cpi_pct_yearly_base2017;")

    # commit and close
    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()