import pandas as pd

#  analysis used to understand the dataset and decide story
# Usage: python3 python/analyze.py

df = pd.read_csv('data/crimes.csv')

print("=== SHAPE ===")
print(df.shape)

print("\n=== CRIME TYPES (top 15) ===")
print(df['Primary Type'].value_counts().head(15))

print("\n=== ARREST RATE BY CRIME TYPE ===")
by_type = df.groupby('Primary Type')['Arrest'].agg(['sum', 'count'])
by_type['arrest_rate'] = (by_type['sum'] / by_type['count'] * 100).round(1)
print(by_type.sort_values('arrest_rate', ascending=False).to_string())

print("\n=== ARREST RATE BY YEAR ===")
df['Year'] = pd.to_datetime(df['Date']).dt.year
by_year = df.groupby('Year')['Arrest'].agg(['sum', 'count'])
by_year['arrest_rate'] = (by_year['sum'] / by_year['count'] * 100).round(1)
print(by_year.to_string())

print("\n=== KEY STATS ===")
peak = by_year['arrest_rate'].max()
recent = by_year.loc[2024, 'arrest_rate']
drop = ((peak - recent) / peak * 100).round(1)
print(f"Peak arrest rate : {peak}%")
print(f"2024 arrest rate : {recent}%")
print(f"Percentage drop  : {drop}%")
print(f"2001 arrests     : {by_year.loc[2001, 'sum']:,}")
print(f"2024 arrests     : {by_year.loc[2024, 'sum']:,}")