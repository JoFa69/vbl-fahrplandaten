import duckdb

def test_nodes_edges():
    con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)
    
    # 1. Identify Relevant Nodes
    # Using a sample time window (e.g. 06:00 to 09:00, Mo-Fr)
    # Actually, we can just do Mo-Fr for the whole day to see the general structure first
    
    # Nodes:
    # A) End stops of all routes active
    # B) Hubs with >= 2 lines
    
    # Active routes and their segments
    query_active_trips = """
        WITH active_trips AS (
            SELECT
                s.li_id,
                l.li_no,
                s.route_id,
                s.frt_id,
                s.frt_start
            FROM cub_schedule s
            JOIN dim_date d ON s.day_id = d.day_id
            JOIN dim_line l ON s.li_id = l.li_id
            WHERE d.tagesart_abbr = 'Mo-Fr'
            AND s.frt_start BETWEEN 21600 AND 32400 -- 06:00 to 09:00
        ),
        route_stops AS (
            SELECT 
                r.route_id,
                r.li_lfd_nr,
                o.stop_text,
                o.lat,
                o.lon
            FROM dim_route r
            JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
            WHERE o.stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
        ),
        trip_segments AS (
            SELECT 
                a.frt_id,
                a.li_no,
                a.route_id,
                rs.li_lfd_nr,
                rs.stop_text,
                rs.lat,
                rs.lon
            FROM active_trips a
            JOIN route_stops rs ON a.route_id = rs.route_id
        ),
        hub_counts AS (
             -- Count distinct lines per stop_text (Hubs >= 2 lines)
             SELECT stop_text, COUNT(DISTINCT li_no) as line_count
             FROM trip_segments
             GROUP BY stop_text
        ),
        relevant_hubs AS (
             SELECT stop_text FROM hub_counts WHERE line_count >= 2
        ),
        end_stops AS (
             SELECT stop_text FROM (
                 SELECT route_id, MIN(li_lfd_nr) as min_seq, MAX(li_lfd_nr) as max_seq
                 FROM route_stops
                 GROUP BY route_id
             ) minmax
             JOIN route_stops r1 ON minmax.route_id = r1.route_id AND minmax.min_seq = r1.li_lfd_nr
             UNION
             SELECT stop_text FROM (
                 SELECT route_id, MIN(li_lfd_nr) as min_seq, MAX(li_lfd_nr) as max_seq
                 FROM route_stops
                 GROUP BY route_id
             ) minmax
             JOIN route_stops r2 ON minmax.route_id = r2.route_id AND minmax.max_seq = r2.li_lfd_nr
        ),
        all_relevant_nodes AS (
             SELECT stop_text FROM relevant_hubs
             UNION
             SELECT stop_text FROM end_stops
             -- We would UNION the extracted whitelist here
        )
        SELECT * FROM all_relevant_nodes
    """
    
    nodes_df = con.execute(query_active_trips).df()
    print(f"Total Relevant Nodes identified: {len(nodes_df)}")
    if len(nodes_df) > 0:
         print(nodes_df.head())
    
test_nodes_edges()
