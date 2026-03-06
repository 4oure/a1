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