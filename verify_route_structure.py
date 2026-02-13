import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

print("--- Checking cub_route granularity ---")
try:
    # Check if a route_id has multiple rows (stops)
    res = con.execute("""
    SELECT route_id, COUNT(*) as distinct_stops
    FROM cub_route
    GROUP BY route_id
    HAVING COUNT(*) > 1
    LIMIT 5
    """).fetchdf()
    print(res)
    
    # Check columns again to see if we have stop sequence
    print("\n--- Sample cub_route Data ---")
    print(con.execute("SELECT * FROM cub_route LIMIT 2").fetchdf())
except Exception as e:
    print(e)
