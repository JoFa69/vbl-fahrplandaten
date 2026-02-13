import duckdb
import pandas as pd

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

print("--- 1. Fahrten-Volumen ---")
print("Total Trips:")
print(con.execute("SELECT COUNT(*) FROM cub_schedule").fetchdf())

print("\nTop 5 Lines by Trip Count:")
try:
    print(con.execute("""
    SELECT l.li_no, COUNT(*) as trips
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.li_id
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 5
    """).fetchdf())
except Exception as e: 
    print(e)
    
print("\n--- 2. Netz-Geometrie ---")
print("Avg Stops per Route:")
print(con.execute("""
    SELECT AVG(cnt) 
    FROM (SELECT route_id, COUNT(*) as cnt FROM dim_route GROUP BY route_id)
""").fetchdf())

print("\n--- 3. Zeit-Metriken ---")
print("Avg Trip Duration (min):")
try:
    print(con.execute("""
        SELECT AVG(frt_ende - frt_start)/60 as avg_duration_min
        FROM cub_schedule
    """).fetchdf())
except Exception as e:
    print(e)

print("\n--- 4. Infrastruktur (Busiest Stops) ---")
try:
    # Joining trips to route definition to get load per stop
    # This might be slow if index is missing, but dataset is small (15MB DB)
    print(con.execute("""
    SELECT o.stop_text, COUNT(*) as stop_events
    FROM cub_schedule s
    JOIN dim_route r ON s.route_id = r.route_id
    JOIN dim_ort o ON CAST(r.ideal_stop_nr AS INTEGER) = o.ort_nr
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 5
    """).fetchdf())
except Exception as e:
    print(f"Failed to calc busiest stops: {e}")

