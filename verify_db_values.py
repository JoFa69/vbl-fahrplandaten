
import duckdb

def verify():
    con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
    res = con.execute("SELECT stop_text, lat, lon FROM dim_ort WHERE stop_text LIKE '%Obernau, Dorf%' LIMIT 1").fetchone()
    print(f"Result: {res}")
    
    if res and abs(res[1] - 47.03098) < 0.001 and abs(res[2] - 8.2524) < 0.001:
        print("SUCCESS: Coordinates match expected values.")
    else:
        print("FAILURE: Coordinates do not match.")

if __name__ == "__main__":
    verify()
