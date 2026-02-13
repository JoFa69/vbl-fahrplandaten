import duckdb
import pandas as pd

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

print("--- Checking dim_route granularity ---")
try:
    # Check if a route_id has multiple rows (stops) in dim_route
    # We suspect dim_route contains the sequence definition
    res = con.execute("""
    SELECT route_id, COUNT(*) as stops_count
    FROM dim_route
    GROUP BY route_id
    HAVING COUNT(*) > 1
    LIMIT 5
    """).fetchdf()
    print(res)
    
    print("\n--- Sample dim_route Data ---")
    print(con.execute("SELECT * FROM dim_route WHERE route_id = (SELECT route_id FROM dim_route LIMIT 1)").fetchdf())
except Exception as e:
    print(f"Error checking dim_route: {e}")

print("\n--- Checking for Stop Sequences ---")
try:
    # Look for a sequence column. ideal_stop_nr might be the stop ID?
    # Is there an order column? Maybe implicit order? Or li_lfd_nr?
    cols = con.execute("PRAGMA table_info(dim_route)").fetchdf()
    print(cols['name'].tolist())
except:
    pass
