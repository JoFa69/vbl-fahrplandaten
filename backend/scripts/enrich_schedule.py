import duckdb
import os
import sys

# Paths
SUB_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "vdv_schedule.duckdb")
MAIN_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "20261231_fahrplandaten_2027.db")

# Normalize paths for DuckDB
SUB_DB_PATH = os.path.abspath(SUB_DB_PATH)
MAIN_DB_PATH = os.path.abspath(MAIN_DB_PATH)

def enrich():
    print(f"Connecting to Main DB: {MAIN_DB_PATH}")
    if not os.path.exists(MAIN_DB_PATH):
        print(f"Error: Main DB not found at {MAIN_DB_PATH}")
        return

    print(f"Connecting to VDV DB: {SUB_DB_PATH}")
    if not os.path.exists(SUB_DB_PATH):
        print(f"Error: VDV DB not found at {SUB_DB_PATH}")
        return

    try:
        # Connect to main DB in read-write mode
        con = duckdb.connect(MAIN_DB_PATH)
        
        # Attach VDV DB
        con.execute(f"ATTACH '{SUB_DB_PATH}' AS vdv (READ_ONLY)")
        
        # 1. Add column if it doesn't exist
        cols_info = con.execute("PRAGMA table_info(cub_schedule)").fetchall()
        cols = [x[1] for x in cols_info]
        if 'fahrtart_nr' not in cols:
            print("Adding fahrtart_nr column to cub_schedule...")
            con.execute("ALTER TABLE cub_schedule ADD COLUMN fahrtart_nr INTEGER")
        else:
            print("Column fahrtart_nr already exists.")
            
        # 2. Update values from raw data
        # Join cub_schedule.frt_id with v_rec_frt.FRT_FID
        # Values in rec_frt are strings, frt_id in cub_schedule is INTEGER
        print("Updating fahrtart_nr values from vdv.v_rec_frt...")
        
        # Mapping: 1=N, 2=DA, 3=DE, 4=Z
        # We'll use the original numbers from the raw file if possible, or join on them
        
        query = """
            UPDATE cub_schedule
            SET fahrtart_nr = CAST(src.FAHRTART_NR AS INTEGER)
            FROM dim_fahrt d
            JOIN vdv.v_rec_frt src ON CAST(d.fahrt_ext_no AS VARCHAR) = src.FRT_FID
            WHERE cub_schedule.frt_id = d.frt_id
        """
        con.execute(query)
        
        # 3. Verify
        print("\nVerification of fahrtart_nr counts in cub_schedule:")
        verify = con.execute("SELECT fahrtart_nr, COUNT(*) FROM cub_schedule GROUP BY 1 ORDER BY 1").df()
        print(verify)
        
        con.execute("DETACH vdv")
        con.close()
        print("\nEnrichment complete.")
        
    except Exception as e:
        print(f"Error during enrichment: {e}")

if __name__ == "__main__":
    enrich()
