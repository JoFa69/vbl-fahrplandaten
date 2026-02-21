import duckdb
import os

# Connect to the MAIN DB (relative from backend/)
db_path = "../20261231_fahrplandaten_2027.db"
print(f"Checking {db_path}...")

try:
    con = duckdb.connect(db_path, read_only=True)
    print("Connected.")
    
    # Check for Obernau, Dorf
    print("Searching for 'Obernau, Dorf' in dim_ort...")
    res = con.execute("SELECT stop_id, stop_no, ort_nr, lat, lon FROM dim_ort WHERE stop_text LIKE '%Obernau, Dorf%'").fetchall()
    print(f"Found: {res}")
    
except Exception as e:
    print(f"Error: {e}")
