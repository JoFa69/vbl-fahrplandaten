import duckdb
import os

db_path = os.path.join('data', 'vdv_schedule.duckdb')
print(f"Checking {db_path}...")

try:
    con = duckdb.connect(db_path, read_only=True)
    print("Connected.")
    
    print("dim_ort columns:")
    cols = con.execute("PRAGMA table_info(dim_ort)").fetchall()
    for c in cols:
        print(c)
        
    print("Sample dim_ort:")
    print(con.execute("SELECT * FROM dim_ort LIMIT 1").fetchall())

except Exception as e:
    print(f"Error: {e}")
