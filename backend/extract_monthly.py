import pandas as pd
import urllib.request

# download raw data file
url = 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/monthly-consumer-price-index-indicator/jan-2023/648401.xlsx'  # URL of the file to download
file_path = './data/648401.xlsx'  # File path where the downloaded file will be saved
urllib.request.urlretrieve(url, file_path)

# seed dataframe from first tab
df = pd.read_excel('./data/648401.xlsx', sheet_name='Data1', skiprows=9)
df.rename(columns={df.columns[0]: 'Date'}, inplace=True)
df = df.iloc[:, :28]

# generate lookup table 
df_lookup = pd.read_excel('./data/648401.xlsx', sheet_name='Index', skiprows=9)
df_lookup = df_lookup.drop(index=[0])
df_lookup = df_lookup.loc[:27, ['Data Item Description', 'Series ID']]
df_lookup[['Item', 'Location']] = df_lookup['Data Item Description'].str.split(';', expand=True).drop(columns=[0,3])
df_lookup = df_lookup[['Item', 'Location', 'Series ID']]
df_lookup.Location = df_lookup.Location.str.strip()
df_lookup.Item = df_lookup.Item.str.strip()
df_lookup.reset_index()

# dump the csv of lookup to disk
df_lookup.to_csv('./data/aus_cpi_lookup_monthly.csv', index=False)

# see the flat cpi table
df_flat_cpi = pd.DataFrame({'Date': [], 'Series ID': [], 'CPI Value': []})
i = 0

# insert into flat cpi table
for index, row in df.iterrows():
    for column, value in row.items():
        df_flat_cpi.loc[i] = [row.Date, column, value]
        i += 1
df_flat_cpi = df_flat_cpi.drop(index=[0])

# do an inner join on the flat cpi table and the lookup table
df_final = pd.merge(df_flat_cpi, df_lookup, on='Series ID', how='inner')
df_final.Location = df_final.Location.str.strip()
df_final.Item = df_final.Item.str.strip()

# dump the csv to disk
df_final.to_csv('./data/aus_cpi_timeseries_monthly.csv', index=False)