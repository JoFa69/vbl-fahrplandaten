import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

query = """
    SELECT 
        l.li_no,
        (r.abfahrt // 3600) as std,
        o_start.stop_name as start_name,
        o_end.stop_name as end_name,
        CASE 
            WHEN o_start.stop_abbr IN ('WSTR', 'WEI') OR o_end.stop_abbr IN ('WSTR', 'WEI') THEN true
            WHEN o_start.stop_name ILIKE '%Depot%' OR o_end.stop_name ILIKE '%Depot%' THEN true
            ELSE false 
        END as is_depot_run
    FROM cub_route r
    JOIN dim_ort o ON r.stop_id = o.stop_id
    JOIN cub_schedule s ON r.schedule_id = s.schedule_id
    JOIN dim_line l ON s.li_id = l.li_id
    LEFT JOIN dim_ort o_start ON s.start_stop_id = o_start.stop_id
    LEFT JOIN dim_ort o_end ON s.end_stop_id = o_end.stop_id
    WHERE o.stop_abbr = 'WSTR'
      AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
    LIMIT 20
"""
print("Testing is_depot_run flag on WSTR subset:")
for r in con.execute(query).fetchall():
    print(r)
