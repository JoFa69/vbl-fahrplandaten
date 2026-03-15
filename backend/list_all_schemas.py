import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '20261231_fahrplandaten_2027.db')

def check():
    if not os.path.exists(DB_PATH):
        print(f"{DB_PATH} not found")
        return
    
    con = duckdb.connect(DB_PATH, read_only=True)
    
    tables = con.execute("SHOW TABLES").fetchall()
    print("Tables in main DB:")
    for t in tables:
        t_name = t[0]
        print(f"\n--- {t_name} ---")
        schema = con.execute(f"PRAGMA table_info('{t_name}')").fetchall()
        for s in schema:
            print(s)
        
        count = con.execute(f"SELECT COUNT(*) FROM {t_name}").fetchone()[0]
        print(f"Row count: {count}")

    con.close()

if __name__ == "__main__":
    check()
