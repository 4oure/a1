import pandas as pd

# run t his once from the project root to generate the aggregated CSV.
# python3 python/preprocess.py

df = pd.read_csv('data/crimes.csv')

# incomplete 2026 data
df = df[df['Year'] <= 2025]

# one row per (Year, Primary Type)
result = df.groupby(['Year', 'Primary Type']).agg(
    total=('ID', 'count'),
    arrests=('Arrest', 'sum')
).reset_index()

result['arrest_rate'] = (result['arrests'] / result['total'] * 100).round(1)

result.to_csv('data/crimes_aggregated.csv', index=False)

print(f"Original rows : {len(df):,}")
print(f"Aggregated rows: {len(result):,}")
print(result.head(10).to_string())

"""
Second version: Does it in chunks.



import pandas as pd

INPUT = 'data/crimes.csv'
OUTPUT = 'data/crimes_aggregated.csv'

chunksize = 200000
parts = []

for chunk in pd.read_csv(
    INPUT,
    usecols=['ID', 'Year', 'Primary Type', 'Arrest'],
    chunksize=chunksize
):
    chunk = chunk[chunk['Year'] <= 2025]

    grouped = chunk.groupby(['Year', 'Primary Type']).agg(
        total=('ID', 'count'),
        arrests=('Arrest', 'sum')
    ).reset_index()

    parts.append(grouped)

combined = pd.concat(parts, ignore_index=True)

result = combined.groupby(['Year', 'Primary Type']).agg(
    total=('total', 'sum'),
    arrests=('arrests', 'sum')
).reset_index()

result['arrest_rate'] = (result['arrests'] / result['total'] * 100).round(1)

result.to_csv(OUTPUT, index=False)

print(f"Aggregated rows: {len(result):,}")
print(result.head(10).to_string())

"""