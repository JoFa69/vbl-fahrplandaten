import duckdb
import pandas as pd

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

print("--- dim_fahrt columns ---")
print(con.execute("PRAGMA table_info(dim_fahrt)").fetchdf()[['name']])

print("\n--- dim_line columns ---")
print(con.execute("PRAGMA table_info(dim_line)").fetchdf()[['name']])

print("\n--- cub_schedule columns ---")
print(con.execute("PRAGMA table_info(cub_schedule)").fetchdf()[['name']])

print("\n--- Testing 'Fahrten pro Linie' using cub_schedule ---")
try:
    # Assuming cub_schedule.li_id joins dim_line.line_id
    # And we count distinct trips (frt_id)
    q = """
    SELECT l.line_no, COUNT(DISTINCT s.frt_id) as fahrten_anzahl
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.line_id
    GROUP BY l.line_no
    LIMIT 5
    """
    print(con.execute(q).fetchdf())
except Exception as e:
    print(f"Query failed: {e}")

print("\n--- Testing 'Service-Frequenz' (Hourly) ---")
try:
    # Assuming frt_start is seconds from midnight
    q = """
    SELECT 
        CAST(s.frt_start / 3600 AS INTEGER) as hour_of_day,
        COUNT(DISTINCT s.frt_id) as fahrten
    FROM cub_schedule s
    GROUP BY 1
    ORDER BY 1
    LIMIT 5
    """
    print(con.execute(q).fetchdf())
except Exception as e:
    print(f"Query failed: {e}")

print("\n--- Testing 'Linienvarianten' ---")
try:
    # Check if route_id represents variants
    # cub_schedule.route_id -> dim_route.route_id
    q = """
    SELECT l.line_no, COUNT(DISTINCT s.route_id) as varianten_anzahl
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.line_id
    GROUP BY l.line_no
    LIMIT 5
    """
    print(con.execute(q).fetchdf())
except Exception as e:
    print(f"Query failed: {e}")
