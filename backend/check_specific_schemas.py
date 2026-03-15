import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '20261231_fahrplandaten_2027.db')

def check():
    if not os.path.exists(DB_PATH):
        print(f"{DB_PATH} not found")
        return
    
    con = duckdb.connect(DB_PATH, read_only=True)
    
    tables = ['dim_umlauf', 'dim_vehicle', 'dim_fahrt']
    for t_name in tables:
        print(f"\n--- {t_name} ---")
        try:
            schema = con.execute(f"PRAGMA table_info('{t_name}')").fetchall()
            for s in schema:
                print(s)
            
            count = con.execute(f"SELECT COUNT(*) FROM {t_name}").fetchone()[0]
            print(f"Row count: {count}")
            
            if count > 0:
                print("Sample:")
                print(con.execute(f"SELECT * FROM {t_name} LIMIT 3").df())
        except Exception as e:
            print(f"Error checking {t_name}: {e}")

    con.close()

if __name__ == "__main__":
    check()
