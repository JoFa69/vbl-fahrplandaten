import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

query = """
    SELECT l.li_no, COUNT(*) as trips, 
           SUM(CASE WHEN s.start_stop_id = o.stop_id THEN 1 ELSE 0 END) as starts_here,
           SUM(CASE WHEN s.end_stop_id = o.stop_id THEN 1 ELSE 0 END) as ends_here,
           CAST(AVG(c_cnt.stop_count) AS INTEGER) as avg_stops_per_trip
    FROM cub_route r
    JOIN dim_ort o ON r.stop_id = o.stop_id
    JOIN cub_schedule s ON r.schedule_id = s.schedule_id
    JOIN dim_line l ON s.li_id = l.li_id
    JOIN (SELECT schedule_id, COUNT(*) as stop_count FROM cub_route GROUP BY schedule_id) c_cnt ON c_cnt.schedule_id = s.schedule_id
    WHERE o.stop_abbr = 'WSTR' 
      AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
    GROUP BY l.li_no
    ORDER BY trips DESC
"""
print("Analysis of trips passing through WSTR with FAHRTART_NR=1:")
for r in con.execute(query).fetchall():
    print(r)
