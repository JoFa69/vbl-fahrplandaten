import duckdb

try:
    con = duckdb.connect("data/vdv_schedule.duckdb", read_only=True)
    print("Verbindung erfolgreich.")
except Exception as e:
    print(f"Fehler bei Verbindung: {e}")

print("--- Check tables ---")
print(con.execute("SHOW TABLES").fetchall())

print("--- Heatmap Query ---")
query_heatmap = """
    SELECT 
        l.li_no,
        CAST(s.frt_start / 3600 AS INTEGER) as hour,
        s.tagesart_nr as tagesart,
        l.li_ri_no as direction,
        COUNT(DISTINCT s.frt_id) as trip_count
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.li_id
    WHERE l.li_no = '1'
    GROUP BY 1, 2, 3, 4
    ORDER BY hour
    LIMIT 5
"""
try:
    print(con.execute(query_heatmap).fetchall())
except Exception as e:
    print(f"Fehler bei Heatmap Query: {e}")

print("--- KPIs Query ---")
query_kpi = """
    SELECT 
        MIN(s.frt_start) as first_trip_sec,
        MAX(s.frt_start) as last_trip_sec,
        COUNT(DISTINCT s.frt_id) as total_trips
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.li_id
    WHERE l.li_no = '1'
"""
try:
    print(con.execute(query_kpi).fetchall())
except Exception as e:
    print(f"Fehler bei KPI Query: {e}")
