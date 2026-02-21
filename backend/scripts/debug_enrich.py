import duckdb
import os

MAIN_DB = r'c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db'
VDV_DB = r'c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\backend\data\vdv_schedule.duckdb'

con = duckdb.connect(MAIN_DB, read_only=True)
con.execute(f"ATTACH '{VDV_DB}' AS vdv (READ_ONLY)")

print("\n--- dim_fahrt sample ---")
print(con.execute("SELECT frt_id, fahrt_ext_no FROM dim_fahrt LIMIT 5").df())

# Check for any overlap via dim_fahrt
print("\n--- Overlap check (via dim_fahrt) ---")
overlap = con.execute("""
    SELECT count(*) 
    FROM dim_fahrt d 
    JOIN vdv.v_rec_frt r ON CAST(d.fahrt_ext_no AS VARCHAR) = r.FRT_FID
""").fetchone()[0]
print(f"Overlap count: {overlap}")

# Check data types
print("\n--- Column Types ---")
print("cub_schedule.frt_id type:")
print(con.execute("SELECT typeof(frt_id) FROM cub_schedule LIMIT 1").fetchone()[0])
print("v_rec_frt.FRT_FID type:")
print(con.execute("SELECT typeof(FRT_FID) FROM vdv.v_rec_frt LIMIT 1").fetchone()[0])

con.close()
