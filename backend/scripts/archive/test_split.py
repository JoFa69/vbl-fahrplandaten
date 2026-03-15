import duckdb
import pandas as pd

pd.set_option('display.max_rows', 100)

con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)

query = """
SELECT DISTINCT
    stop_point_text,
    stop_ort,
    stop_name
FROM (
    SELECT 
        stop_point_text,
        CASE 
            WHEN stop_point_text LIKE '%,%' THEN trim(split_part(stop_point_text, ',', 1))
            ELSE trim(split_part(stop_point_text, ' ', 1))
        END as stop_ort,
        CASE 
            WHEN stop_point_text LIKE '%,%' THEN 
                trim(substring(stop_point_text, length(split_part(stop_point_text, ',', 1)) + 2))
            WHEN stop_point_text NOT LIKE '% %' THEN 
                stop_point_text
            ELSE 
                trim(substring(stop_point_text, length(split_part(stop_point_text, ' ', 1)) + 2))
        END as stop_name
    FROM dim_ort
)
LIMIT 50;
"""

df = con.execute(query).df()
print(df)

print("--- No space or comma ---")
df2 = con.execute("SELECT DISTINCT stop_point_text FROM dim_ort WHERE stop_point_text NOT LIKE '% %' AND stop_point_text NOT LIKE '%,%'").df()
print(df2)
