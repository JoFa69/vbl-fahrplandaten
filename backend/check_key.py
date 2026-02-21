import duckdb
import os

db_path = os.path.join('data', 'vdv_schedule.duckdb')
print(f"Checking {db_path}...")

try:
    con = duckdb.connect(db_path, read_only=True)
    print("Connected.")

    # Check for specific ID from CSV
    print("Searching for HST_NR_NATIONAL = '8500100'...")
    res = con.execute("SELECT ORT_NR, ORT_NAME, HST_NR_NATIONAL FROM rec_ort WHERE HST_NR_NATIONAL = '8500100'").fetchall()
    print(f"Found: {res}")

    # Check for another one: 1100518
    print("Searching for HST_NR_NATIONAL = '8573046' (from manual mapping guess)...") # 1100518 in CSV, 8573046 in DB sample? No wait.
    # 1100518 in CSV had number 1100518? 
    # Let's just list some valid HST_NR_NATIONALs from DB to see the format.
    print("Sample HST_NR_NATIONAL from DB:")
    samples = con.execute("SELECT HST_NR_NATIONAL, ORT_NAME FROM rec_ort WHERE HST_NR_NATIONAL IS NOT NULL LIMIT 5").fetchall()
    for s in samples:
        print(s)

except Exception as e:
    print(f"Error: {e}")
