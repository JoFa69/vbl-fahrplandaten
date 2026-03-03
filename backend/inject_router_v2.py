import os

file_path = "c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/backend/app/routers/analytics.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't duplicate it
if "@router.get(\"/network-nodes\")" in content:
    print("Endpoint already exists")
else:
    new_endpoint = '''
@router.get("/network-nodes")
def get_network_nodes(
    tagesart: Optional[str] = Query("Mo-Fr", description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    time_from: Optional[int] = Query(21600, description="Start time in seconds since midnight (default 06:00)"),
    time_to: Optional[int] = Query(32400, description="End time in seconds since midnight (default 09:00)"),
    x_scenario: str = Header("strategic")
):
    """
    Returns relevant nodes (terminals, hubs >= 2 lines, and whitelist) and abstract edges
    between these nodes for a targeted time window and day type.
    """
    con = get_db(x_scenario)
    try:
        # Define Whitelist based on Excel extraction
        white_list = [
            "493 Tellbus", "Adligenswil Dorf", "Allmend/Messe", "Arth-Goldau",
            "Bahnhof Malters", "Bern", "Biregghof", "Bramberg", "Buchrain",
            "Buchrain Dorf", "Bundesplatz", "Bösch", "Bösfeld", "Büttenhalde",
            "Château Gütsch", "Chörbli", "Dattenberg", "Ebikon Bahnhof", "Eggen",
            "Eichhof", "Eigenthal Talboden", "Emmenbrücke", "Emmenbrücke Bahnhof Süd",
            "Ennethorw", "Erlenmatte", "Fichtenstrasse", "Flugzeugwerke", "Friedental",
            "Frohburg", "Gasshof", "Gersag", "Gisikon-Root Bahnhof", "Grosshofstrasse",
            "Götzentalstrasse", "Gütsch", "Hirtenhofstrasse", "Hofmatt-Bellpark",
            "Horw Bahnhof", "Horw Zentrum", "Hubelmatt", "Hünenberg Rothus",
            "Industriestrasse", "Kantonalbank", "Kantonsspital", "Kapf",
            "Kapuzinerweg", "Kasernenplatz", "Kastanienbaum Schiffstation",
            "Kehrsiten-Bürgenstock", "Klösterli", "Kreuz", "Kreuzstutz",
            "Kriens Busschleife", "Lerchenbühl", "Linie 1 Ri Fildern",
            "Linie 26 Ri Brüelstrasse", "Linie 26 Ri Ottigenbühl", "Littau, Bahnhof",
            "Luzern Bahnhof", "Luzernerhof/Wey", "Löwen", "Maihof", "Mattenhof",
            "Matthof", "Meggen", "Obere Weinhalde", "Oberfeld", "Obergütsch",
            "Obernau Dorf", "Olten/Bern", "Perlen Fabrik", "Pilatusbahnen",
            "Pilatusmarkt", "Pilatusplatz", "Piuskirche", "Riffig", "Root D4",
            "Root Dorf", "Rotkreuz Bahnhof", "Rüeggisingen", "Schiffstation",
            "Schlossberg", "Schlössli", "Schlösslihalde", "Schönbühl",
            "Schützenhaus", "Sidhalde", "Sonnenberg", "Sonnenbergbahn",
            "Sonnenplatz", "Spier", "Spitz", "Sprengi", "St. Karli", "St. Wendelin",
            "Staffeln Schulhaus", "Stampfeli", "Stans/Sarnen", "Steinibach",
            "Sternen", "Sternmatt", "Technikumstrasse", "Tschädigen",
            "Udligenswil alte Post", "Unterlöchli", "Verkehrshaus",
            "Verkehrshaus-Lido", "Waldibrücke", "Waldstrasse", "Wartegg",
            "Weggis", "Wegscheide", "Weichlen", "Weitblick", "Würzenbach",
            "Zentralschulhaus", "Zentrum", "Zentrum Pilatus", "Zumhof",
            "Zürich", "von Gottlieben", "Hinfahrt nach Gottlieben"
        ]
        
        # Build whitelist values string
        wl_values = ", ".join([f"('{w}')" for w in white_list])
        
        # Build WHERE clause
        where_params = []
        where_clauses = []
        if tagesart:
            where_clauses.append("d.tagesart_abbr = ?")
            where_params.append(tagesart)
        if time_from is not None and time_to is not None:
             where_clauses.append("s.frt_start BETWEEN ? AND ?")
             where_params.append(time_from)
             where_params.append(time_to)
             
        where_sql = " AND ".join(where_clauses)
        if where_sql:
             where_sql = "WHERE " + where_sql

        # 1. Complex query to find nodes and build abstract edges
        query = f"""
        WITH whitelist AS (
            SELECT column1 as stop_name FROM (VALUES {wl_values})
        ),
        active_trips AS (
            SELECT s.frt_id, s.route_id, l.li_no, l.li_ri_no, s.li_id, s.frt_start
            FROM cub_schedule s
            JOIN dim_date d ON s.day_id = d.day_id
            JOIN dim_line l ON s.li_id = l.li_id
            {where_sql}
        ),
        route_stops AS (
            SELECT r.route_id, r.li_lfd_nr, o.stop_point_text as stop_text, r.ideal_stop_nr, o.lat, o.lon
            FROM dim_route r
            JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
            WHERE o.stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
            QUALIFY ROW_NUMBER() OVER (PARTITION BY r.route_id, r.li_lfd_nr ORDER BY o.stop_point_no) = 1
        ),
        trip_sequences AS (
            SELECT a.frt_id, a.li_no, a.li_ri_no, a.frt_start, rs.li_lfd_nr, rs.stop_text, rs.ideal_stop_nr, rs.lat, rs.lon
            FROM active_trips a
            JOIN route_stops rs ON a.route_id = rs.route_id
        ),
        -- Count distinct lines per stop code to find hubs
        hub_counts AS (
            SELECT ideal_stop_nr, MAX(stop_text) as stop_text, COUNT(DISTINCT li_no) as line_count
            FROM trip_sequences
            GROUP BY ideal_stop_nr
        ),
        relevant_nodes AS (
            -- Hubs
            SELECT ideal_stop_nr, stop_text, 'hub' as category FROM hub_counts WHERE line_count >= 2
            UNION
            -- Whitelist (ILIKE match to catch variations like Adligenswil, Dorf vs Adligenswil Dorf)
            SELECT h.ideal_stop_nr, h.stop_text, 'whitelist' as category
            FROM hub_counts h
            JOIN whitelist w ON h.stop_text ILIKE '%' || w.stop_name || '%'
            UNION
            -- Terminals (first and last stops of active routes)
            SELECT h.ideal_stop_nr, h.stop_text, 'terminal' as category
            FROM (
                SELECT route_id, MIN(li_lfd_nr) as min_seq, MAX(li_lfd_nr) as max_seq
                FROM route_stops GROUP BY route_id
            ) minmax
            JOIN route_stops rs ON (rs.route_id = minmax.route_id AND (rs.li_lfd_nr = minmax.min_seq OR rs.li_lfd_nr = minmax.max_seq))
            JOIN hub_counts h ON h.ideal_stop_nr = rs.ideal_stop_nr
        ),
        final_nodes AS (
             SELECT r.ideal_stop_nr, MAX(r.stop_text) as stop_text, STRING_AGG(DISTINCT r.category, ',') as categories,
                    MAX(rs.lat) as lat, MAX(rs.lon) as lon
             FROM relevant_nodes r
             JOIN route_stops rs ON r.ideal_stop_nr = rs.ideal_stop_nr
             GROUP BY r.ideal_stop_nr
        ),
        -- Filter sequences to ONLY include relevant nodes
        filtered_sequences AS (
            SELECT ts.frt_id, ts.li_no, ts.li_ri_no, ts.li_lfd_nr, ts.stop_text, ts.ideal_stop_nr, ts.frt_start, ts.lat, ts.lon
            FROM trip_sequences ts
            JOIN final_nodes fn ON ts.ideal_stop_nr = fn.ideal_stop_nr
        ),
        -- Pair sequential nodes over the trip
        node_pairs AS (
            SELECT 
                frt_id, li_no, li_ri_no,
                stop_text as from_node,
                LEAD(stop_text) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_node,
                ideal_stop_nr as from_id,
                LEAD(ideal_stop_nr) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_id,
                frt_start as from_start_time,
                -- We approximate travel time based on the start time and order, but we don't have accurate arrival times
                -- in cub_schedule per intermediate stop in this simple schema. We'll leave duration out for now or compute
                -- based on geography.
                1 as seq_increment
            FROM filtered_sequences
        ),
        abstract_edges AS (
            SELECT 
                li_no, li_ri_no,
                from_id, to_id, MAX(from_node) as from_name, MAX(to_node) as to_name,
                COUNT(DISTINCT frt_id) as trip_volume
            FROM node_pairs
            WHERE to_id IS NOT NULL AND from_id != to_id
            GROUP BY li_no, li_ri_no, from_id, to_id
        ),
        -- Line Timetables at Nodes (Minutes)
        node_departures AS (
            SELECT 
                ideal_stop_nr, li_no, li_ri_no,
                COUNT(DISTINCT frt_id) as trips,
                -- Convert start time seconds to minute of the hour (0-59)
                CAST(MOD(frt_start / 60, 60) AS INTEGER) as dep_minute
            FROM filtered_sequences
        ),
        node_timetables AS (
             SELECT 
                 ideal_stop_nr, li_no, li_ri_no,
                 SUM(trips) as total_trips,
                 -- We collect the most frequent/distinct departure minutes for a given hour
                 -- (DuckDB list functions aren't universally simple here, so we string_agg distinct minutes)
                 STRING_AGG(DISTINCT CAST(dep_minute AS VARCHAR), ', ' ORDER BY dep_minute) as departure_minutes
             FROM node_departures
             GROUP BY ideal_stop_nr, li_no, li_ri_no
        )
        
        -- Since we can't cleanly return multiple distinct result sets from a single string in python easily without multiple queries,
        -- we will use temporary tables/views, or just execute 3 sub-queries that reuse the WITH clause logic if needed.
        -- Given DuckDB speed, re-evaluating the CTE or just nesting is fine.
        -- An even better approach: We create temporary views.
        SELECT 1;
        """
        
        # Because we need 3 datasets (Nodes, Edges, Timetables) and want to be efficient:
        con.execute("CREATE TEMP VIEW active_trips_v AS " + f"SELECT s.frt_id, s.route_id, l.li_no, l.li_ri_no, s.li_id, s.frt_start FROM cub_schedule s JOIN dim_date d ON s.day_id = d.day_id JOIN dim_line l ON s.li_id = l.li_id {where_sql}")
        
        con.execute(f"CREATE TEMP VIEW whitelist_v AS SELECT column1 as stop_name FROM (VALUES {wl_values})")
        
        con.execute("""
            CREATE TEMP VIEW route_stops_v AS 
            SELECT r.route_id, r.li_lfd_nr, o.stop_point_text as stop_text, r.ideal_stop_nr, o.lat, o.lon
            FROM dim_route r JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
            WHERE o.stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
            QUALIFY ROW_NUMBER() OVER (PARTITION BY r.route_id, r.li_lfd_nr ORDER BY o.stop_point_no) = 1
        """)
        
        con.execute("""
            CREATE TEMP VIEW trip_sequences_v AS 
            SELECT a.frt_id, a.li_no, a.li_ri_no, a.frt_start, rs.li_lfd_nr, rs.stop_text, rs.ideal_stop_nr, rs.lat, rs.lon
            FROM active_trips_v a JOIN route_stops_v rs ON a.route_id = rs.route_id
        """)
        
        con.execute("""
            CREATE TEMP VIEW final_nodes_v AS 
            WITH hub_counts AS (
                SELECT ideal_stop_nr, MAX(stop_text) as stop_text, COUNT(DISTINCT li_no) as line_count FROM trip_sequences_v GROUP BY ideal_stop_nr
            ),
            relevant_nodes AS (
                SELECT ideal_stop_nr, stop_text, 'hub' as category FROM hub_counts WHERE line_count >= 2
                UNION
                SELECT h.ideal_stop_nr, h.stop_text, 'whitelist' as category FROM hub_counts h JOIN whitelist_v w ON h.stop_text ILIKE '%' || w.stop_name || '%'
                UNION
                SELECT h.ideal_stop_nr, h.stop_text, 'terminal' as category FROM (
                    SELECT route_id, MIN(li_lfd_nr) as min_seq, MAX(li_lfd_nr) as max_seq FROM route_stops_v GROUP BY route_id
                ) minmax
                JOIN route_stops_v rs ON (rs.route_id = minmax.route_id AND (rs.li_lfd_nr = minmax.min_seq OR rs.li_lfd_nr = minmax.max_seq))
                JOIN hub_counts h ON h.ideal_stop_nr = rs.ideal_stop_nr
            )
            SELECT r.ideal_stop_nr, MAX(r.stop_text) as stop_text, STRING_AGG(DISTINCT r.category, ',') as categories, MAX(rs.lat) as lat, MAX(rs.lon) as lon
            FROM relevant_nodes r JOIN route_stops_v rs ON r.ideal_stop_nr = rs.ideal_stop_nr GROUP BY r.ideal_stop_nr
        """)
        
        con.execute("""
            CREATE TEMP VIEW filtered_sequences_v AS 
            SELECT ts.frt_id, ts.li_no, ts.li_ri_no, ts.li_lfd_nr, ts.stop_text, ts.ideal_stop_nr, ts.frt_start
            FROM trip_sequences_v ts JOIN final_nodes_v fn ON ts.ideal_stop_nr = fn.ideal_stop_nr
        """)
        
        # 1. Fetch Nodes
        nodes_raw = con.execute("SELECT ideal_stop_nr, stop_text, categories, lat, lon FROM final_nodes_v").fetchall()
        nodes = [{"id": r[0], "name": r[1], "categories": r[2].split(','), "lat": r[3], "lon": r[4]} for r in nodes_raw]
        
        # 2. Fetch Abstract Edges
        edges_raw = con.execute("""
            WITH node_pairs AS (
                SELECT frt_id, li_no, li_ri_no, ideal_stop_nr as from_id, LEAD(ideal_stop_nr) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_id
                FROM filtered_sequences_v
            )
            SELECT li_no, li_ri_no, from_id, to_id, COUNT(DISTINCT frt_id) as trip_volume
            FROM node_pairs WHERE to_id IS NOT NULL AND from_id != to_id
            GROUP BY li_no, li_ri_no, from_id, to_id
        """).fetchall()
        
        edges = [{"line_no": r[0], "direction": r[1], "from": r[2], "to": r[3], "trip_volume": r[4]} for r in edges_raw]
        
        # 3. Fetch Timetables per Node (Aggregated departure minutes)
        # We calculate the interval between average frt_starts per line at a node to find the Base Takt
        timetables_raw = con.execute("""
             WITH node_departures AS (
                SELECT ideal_stop_nr, li_no, li_ri_no, frt_start,
                       CAST(MOD(frt_start / 60, 60) AS INTEGER) as dep_minute,
                       LAG(frt_start) OVER (PARTITION BY ideal_stop_nr, li_no, li_ri_no ORDER BY frt_start) as prev_start
                FROM filtered_sequences_v
            ),
            node_intervals AS (
                SELECT ideal_stop_nr, li_no, li_ri_no, ROUND((frt_start - prev_start) / 60.0) as headway
                FROM node_departures WHERE prev_start IS NOT NULL AND (frt_start - prev_start) > 0
            ),
            base_takt AS (
                 SELECT ideal_stop_nr, li_no, li_ri_no, CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY headway) AS INTEGER) as takt
                 FROM node_intervals GROUP BY ideal_stop_nr, li_no, li_ri_no
            )
            SELECT n.ideal_stop_nr, n.li_no, n.li_ri_no,
                   STRING_AGG(DISTINCT CAST(n.dep_minute AS VARCHAR), ', ' ORDER BY n.dep_minute) as minutes,
                   MAX(b.takt) as base_takt
            FROM node_departures n
            LEFT JOIN base_takt b ON n.ideal_stop_nr = b.ideal_stop_nr AND n.li_no = b.li_no AND n.li_ri_no = b.li_ri_no
            GROUP BY n.ideal_stop_nr, n.li_no, n.li_ri_no
        """).fetchall()
        
        timetables = {}
        for r in timetables_raw:
            node_id = r[0]
            if node_id not in timetables:
                timetables[node_id] = []
            timetables[node_id].append({
                "line_no": r[1],
                "direction": r[2],
                "minutes": r[3],
                "takt": r[4] if r[4] else 0
            })
            
        con.execute("DROP VIEW IF EXISTS active_trips_v")
        con.execute("DROP VIEW IF EXISTS whitelist_v")
        con.execute("DROP VIEW IF EXISTS route_stops_v")
        con.execute("DROP VIEW IF EXISTS trip_sequences_v")
        con.execute("DROP VIEW IF EXISTS final_nodes_v")
        con.execute("DROP VIEW IF EXISTS filtered_sequences_v")

        return {
             "nodes": nodes,
             "edges": edges,
             "timetables": timetables
        }

    except Exception as e:
        print(f"Network Nodes Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
'''

    content += "\n" + new_endpoint + "\n"
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Endpoint injected successfully")
