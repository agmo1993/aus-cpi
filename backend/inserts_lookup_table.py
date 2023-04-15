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
    logging.info("Starting program to insert cpi lookup data into table")
    logging.info("Reading data file aus_cpi_lookup_monthly.csv")

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv('./data/aus_cpi_lookup_monthly.csv')

    # Connect to a PostgreSQL database
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="auscpidb",
        user="postgres",
        password="postgres"
    )
    

    logging.info("Inserting rows into table seriesid_lookup")
    # Insert the rows into the table
    for index, row in df.iterrows():
        try:
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO auscpi.seriesid_lookup (seriesid, item, city, data_frequency)
                VALUES (%s, %s, %s, %s)
            ''', (row['Series ID'], row['Item'], row['Location'], 'Monthly'))
            conn.commit()
        except Exception as e:
            conn.rollback()
            logging.error(e)

    logging.info("Reading data file aus_cpi_lookup_quarterly.csv")

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv('./data/aus_cpi_lookup_quarterly.csv')

    logging.info("Inserting rows into table seriesid_lookup")
    # Insert the rows into the table
    for index, row in df.iterrows():
        try:
            cur.execute('''
                INSERT INTO auscpi.seriesid_lookup (seriesid, item, city, data_frequency)
                VALUES (%s, %s, %s, %s)
            ''', (row['Series ID'], row['Item'], row['Location'], 'Quarterly'))
            conn.commit()
        except Exception as e:
            conn.rollback()
            logging.error(e)

    conn.close()

if __name__ == "__main__":
    main()