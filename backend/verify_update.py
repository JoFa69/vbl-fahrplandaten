import duckdb
import os

db_path = "../20261231_fahrplandaten_2027.db"
print(f"Checking {db_path}...")

try:
    con = duckdb.connect(db_path, read_only=True)
    
    # Check count
    count = con.execute("SELECT COUNT(*) FROM dim_ort").fetchone()[0]
    print(f"Total rows in dim_ort: {count}")
    
    # Check specific stop
    print("Searching for 'Obernau, Dorf'...")
    res = con.execute("SELECT stop_text, lat, lon FROM dim_ort WHERE stop_text LIKE '%Obernau, Dorf%'").fetchall()
    print(f"Result: {res}")
    
    # Check another random updated stop
    print("Checking for stops with non-null lat/lon...")
    res_valid = con.execute("SELECT stop_text, lat, lon FROM dim_ort WHERE lat IS NOT NULL LIMIT 5").fetchall()
    print(f"Valid Lat/Lon samples: {res_valid}")

except Exception as e:
    print(f"Error: {e}")
