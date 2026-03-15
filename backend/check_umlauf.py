import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '20261231_fahrplandaten_2027.db')
VDV_DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'vdv_schedule.duckdb')

def check():
    if not os.path.exists(DB_PATH):
        print(f"{DB_PATH} not found")
        return
    
    con = duckdb.connect(DB_PATH, read_only=True)
    
    print("\n--- dim_umlauf (in tactical DB) ---")
    try:
        count = con.execute("SELECT COUNT(*) FROM dim_umlauf").fetchone()[0]
        print(f"Count: {count}")
        if count > 0:
            print("Sample:")
            rows = con.execute("SELECT * FROM dim_umlauf LIMIT 5").fetchall()
            for r in rows:
                print(r)
        
        schema = con.execute("PRAGMA table_info('dim_umlauf')").fetchall()
        print("Schema:")
        for s in schema:
            print(s)
    except Exception as e:
        print(f"Error checking dim_umlauf: {e}")

    if os.path.exists(VDV_DB_PATH):
        print(f"\n--- rec_umlauf (in VDV DB: {VDV_DB_PATH}) ---")
        try:
            con.execute(f"ATTACH '{VDV_DB_PATH}' AS vdv (READ_ONLY);")
            count = con.execute("SELECT COUNT(*) FROM vdv.rec_umlauf").fetchone()[0]
            print(f"Count: {count}")
            
            schema = con.execute("PRAGMA table_info('vdv.rec_umlauf')").fetchall()
            print("Schema:")
            for s in schema:
                print(s)
                
            if count > 0:
                print("Sample:")
                rows = con.execute("SELECT * FROM vdv.rec_umlauf LIMIT 5").df()
                print(rows)
        except Exception as e:
            print(f"Error checking vdv.rec_umlauf: {e}")
    else:
        print(f"\n{VDV_DB_PATH} not found")

    con.close()

if __name__ == "__main__":
    check()
