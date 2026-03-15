import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '20261231_fahrplandaten_2027.db')

def check():
    if not os.path.exists(DB_PATH):
        print(f"{DB_PATH} not found")
        return
    
    con = duckdb.connect(DB_PATH, read_only=True)
    
    print("\n--- cub_schedule columns ---")
    try:
        schema = con.execute(f"PRAGMA table_info('cub_schedule')").fetchall()
        cols = [s[1] for s in schema]
        print(", ".join(cols))
    except Exception as e:
        print(f"Error checking cub_schedule: {e}")

    con.close()

if __name__ == "__main__":
    check()
