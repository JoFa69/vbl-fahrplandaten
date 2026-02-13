import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

print("--- Counting Rows vs Distinct Trips ---")
try:
    res = con.execute("""
    SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT frt_id) as unique_trips
    FROM cub_schedule
    """).fetchdf()
    print(res)
except Exception as e:
    print(e)
