import duckdb
import pandas as pd

con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)

df = con.execute("SELECT stop_point_text, stop_ort, stop_name FROM dim_ort LIMIT 20").df()
print("Sample:")
print(df)

df_same = con.execute("SELECT stop_point_text, stop_ort, stop_name FROM dim_ort WHERE stop_ort = stop_name LIMIT 10").df()
print("\\nWhere Ort == Name:")
print(df_same)

con.close()
