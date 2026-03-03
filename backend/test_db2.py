import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
try:
    con = duckdb.connect(db_path, read_only=True)
    print("--- SHOW TABLES ---")
    print(con.execute("SHOW TABLES").fetchall())
    
    print("--- DIM_DATE ---")
    print(con.execute("SELECT MIN(day_id), MAX(day_id) FROM dim_date").fetchall())
except Exception as e:
    print(f"Error: {e}")
