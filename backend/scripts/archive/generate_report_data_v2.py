import duckdb
import pandas as pd

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

print("--- 4. Infrastruktur (Busiest Stops - Fixed) ---")
try:
    # Try joining on stop_abbr (string match)
    # Cast ideal_stop_nr to string just in case, though it looked like a string 'STBA'
    print(con.execute("""
    SELECT o.stop_text, COUNT(*) as stop_events
    FROM cub_schedule s
    JOIN dim_route r ON s.route_id = r.route_id
    JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 5
    """).fetchdf())
except Exception as e:
    print(f"Failed to calc busiest stops: {e}")
    
    # Debug: see what ideal_stop_nr looks like vs stop_abbr
    print("\nDebug Data:")
    print(con.execute("SELECT ideal_stop_nr FROM dim_route LIMIT 3").fetchdf())
    print(con.execute("SELECT stop_abbr FROM dim_ort LIMIT 3").fetchdf())
