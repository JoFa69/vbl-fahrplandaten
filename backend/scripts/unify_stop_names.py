import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "20261231_fahrplandaten_2027.db")

def unify_names():
    print(f"Applying unified comma syntax to {DB_PATH}...")
    
    try:
        con = duckdb.connect(DB_PATH)
    except Exception as e:
        print(f"Error connecting. {e}")
        return

    # Update stop_point_text to explicitly be "Ort, Name" globally
    con.execute("""
        UPDATE dim_ort
        SET stop_point_text = 
            CASE 
                WHEN stop_ort = stop_name THEN stop_ort
                ELSE stop_ort || ', ' || stop_name
            END
    """)

    count = con.execute("SELECT count(*) FROM dim_ort").fetchone()[0]
    print(f"Updated {count} records to strict comma syntax.")
    
    # Print sample
    print("Verification Sample:")
    sample = con.execute("SELECT stop_point_text, stop_ort, stop_name FROM dim_ort LIMIT 10").df()
    print(sample)
    
    con.close()

if __name__ == "__main__":
    unify_names()
