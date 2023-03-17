import pandas as pd
import urllib.request

# download raw data file
url = 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/dec-quarter-2022/640107.xlsx'  # URL of the file to download
file_path = './data/640107.xlsx'  # File path where the downloaded file will be saved
urllib.request.urlretrieve(url, file_path)

# seed dataframe from first tab
df = pd.read_excel('./data/640107.xlsx', sheet_name='Data1', skiprows=9)
df.rename(columns={df.columns[0]: 'Date'}, inplace=True)
df.dropna(inplace=True)

# extract data from all cities in sheet
for i in range(2,6):
  temp_df = pd.read_excel('./data/640107.xlsx', sheet_name=f'Data{i}', skiprows=9)
  temp_df.rename(columns={temp_df.columns[0]: 'Date'}, inplace=True)
  temp_df.dropna(inplace=True)
  df = pd.merge(df, temp_df, on='Date', how='outer')

# generate lookup table 
df_lookup = pd.read_excel('./data/640107.xlsx', sheet_name='Index', skiprows=9)
df_lookup = df_lookup.drop(index=[0, 1369, 1370])
df_lookup = df_lookup.loc[:, ['Data Item Description', 'Series ID']]
df_lookup[['Item', 'Location']] = df_lookup['Data Item Description'].str.split(';', expand=True).drop(columns=[0,3])
df_lookup = df_lookup[['Item', 'Location', 'Series ID']]
df_lookup.Location = df_lookup.Location.str.strip()
df_lookup.Item = df_lookup.Item.str.strip()
df_lookup.reset_index()

# dump the csv of lookup to disk
df_lookup.to_csv('./data/aus_cpi_lookup_quarterly.csv', index=False)

# see the flat cpi tabl
df_flat_cpi = pd.DataFrame({'Date': [], 'Series ID': [], 'CPI Value': []})

# insert into flat cpi table
i = 0
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
df_final.to_csv('./data/aus_cpi_timeseries.csv', index=False)
