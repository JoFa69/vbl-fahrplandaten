
import duckdb

def inspect_hoze():
    con = duckdb.connect(database='20261231_fahrplandaten_2027.db', read_only=True)
    
    print("--- Searching for 'HOZE' ---")
    query = "SELECT * FROM dim_ort WHERE stop_abbr = 'HOZE'"
    df = con.execute(query).fetchdf()
    print(df.to_string())
    
    con.close()

if __name__ == "__main__":
    inspect_hoze()
