import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"

try:
    con = duckdb.connect(db_path, read_only=True)
    
    print("--- Heatmap Query ---")
    query_heatmap = """
        SELECT 
            l.li_no,
            CAST(s.frt_start / 3600 AS INTEGER) as hour,
            d.tagesart_abbr as tagesart,
            l.li_ri_no as direction,
            COUNT(DISTINCT s.frt_id) as trip_count
        FROM cub_schedule s
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        WHERE l.li_no = '1' AND d.tagesart_abbr = 'Mo-Fr' AND l.li_ri_no = 1
        GROUP BY 1, 2, 3, 4
        ORDER BY hour
        LIMIT 5
    """
    print(con.execute(query_heatmap).fetchall())

    print("--- Headway Query ---")
    query_headway = """
        WITH ordered_trips AS (
            SELECT 
                s.frt_id,
                s.frt_start,
                d.tagesart_abbr,
                l.li_ri_no,
                LAG(s.frt_start) OVER (PARTITION BY l.li_ri_no, d.tagesart_abbr ORDER BY s.frt_start) as prev_start
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            WHERE l.li_no = '1' AND d.tagesart_abbr = 'Mo-Fr' AND l.li_ri_no = 1
        ),
        headways AS (
            SELECT 
                tagesart_abbr,
                li_ri_no,
                ROUND((frt_start - prev_start) / 60.0) as headway_min
            FROM ordered_trips
            WHERE prev_start IS NOT NULL
        )
        SELECT CAST(headway_min AS INTEGER) as headway, COUNT(*) as count
        FROM headways
        GROUP BY headway_min
        ORDER BY count DESC
        LIMIT 5
    """
    print(con.execute(query_headway).fetchall())

    print("--- KPIs Query ---")
    query_kpi = """
        SELECT 
            MIN(s.frt_start) as first_trip_sec,
            MAX(s.frt_start) as last_trip_sec,
            COUNT(DISTINCT s.frt_id) as total_trips
        FROM cub_schedule s
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        WHERE l.li_no = '1' AND d.tagesart_abbr = 'Mo-Fr' AND l.li_ri_no = 1
    """
    print(con.execute(query_kpi).fetchall())

    print("--- Route Variants Split ---")
    query_routes = """
        SELECT 
            r.route_hash,
            MIN(do.stop_text) as clean_name,
            l.li_ri_no,
            COUNT(DISTINCT s.frt_id) as trip_count
        FROM cub_schedule s
        JOIN dim_route r ON s.route_id = r.route_id
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        LEFT JOIN dim_ort do ON r.ideal_stop_nr = do.stop_abbr AND r.li_lfd_nr = 1
        WHERE l.li_no = '1' AND d.tagesart_abbr = 'Mo-Fr'
        GROUP BY 1, 3
        ORDER BY trip_count DESC
        LIMIT 5
    """
    print(con.execute(query_routes).fetchall())

except Exception as e:
    print(f"Fehler bei Verbindung/Abfrage: {e}")
