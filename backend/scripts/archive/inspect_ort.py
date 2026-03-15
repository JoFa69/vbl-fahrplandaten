
import duckdb

def inspect_dim_ort():
    con = duckdb.connect(database='20261231_fahrplandaten_2027.db', read_only=True)
    
    # Search for Luzern Bahnhof
    print("--- Searching for 'Luzern, Bahnhof' ---")
    query = "SELECT * FROM dim_ort WHERE stop_text LIKE '%Bahnhof%' LIMIT 5"
    df = con.execute(query).fetchdf()
    print(df.to_string())
    
    # Check what columns exist
    print("\n--- Columns in dim_ort ---")
    print(df.columns.tolist())
    
    con.close()

if __name__ == "__main__":
    inspect_dim_ort()
