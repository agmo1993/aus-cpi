import pandas as pd
import urllib.request

# download raw data file
url = 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/wage-price-index-australia/mar-2023/63450Table2bto9b.xlsx'  # URL of the file to download
file_path = './data/63450Table2bto9b.xlsx'  # File path where the downloaded file will be saved
urllib.request.urlretrieve(url, file_path)

# seed dataframe from first tab
df = pd.read_excel('./data/63450Table2bto9b.xlsx', sheet_name='Data1', skiprows=9)
df.rename(columns={df.columns[0]: 'Date'}, inplace=True)

# generate lookup table 
df_lookup = pd.read_excel('./data/63450Table2bto9b.xlsx', sheet_name='Index', skiprows=9)
df_lookup = df_lookup.drop(index=[0])
df_lookup = df_lookup.loc[:68, ['Data Item Description', 'Series ID']]
df_lookup[['Location', 'Sector', 'Industry']] = df_lookup['Data Item Description'].str.split(';', expand=True).drop(columns=[0, 1, 5])
df_lookup = df_lookup[['Location', 'Sector', 'Industry', 'Series ID']]
df_lookup.Location = df_lookup.Location.str.strip()
df_lookup.Sector = df_lookup.Sector.str.strip()
df_lookup.Industry = df_lookup.Industry.str.strip()
df_lookup.reset_index()

# dump the csv of lookup to disk
df_lookup.to_csv('./data/aus_wpi_lookup.csv', index=False)

# see the flat cpi table
df_flat_cpi = pd.DataFrame({'Date': [], 'Series ID': [], 'WPI Value': []})
i = 0

# insert into flat cpi table
for index, row in df.iterrows():
    for column, value in row.items():
        df_flat_cpi.loc[i] = [row.Date, column, value]
        i += 1
df_flat_cpi = df_flat_cpi.drop(index=[0])

# do an inner join on the flat cpi table and the lookup table
df_final = pd.merge(df_flat_cpi, df_lookup, on='Series ID', how='inner')

# dump the csv to disk
df_final.to_csv('./data/aus_wpi_timeseries.csv', index=False)