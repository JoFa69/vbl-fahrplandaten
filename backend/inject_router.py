import os

file_path = "c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/backend/app/routers/analytics.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
@router.get("/network-nodes")
def get_network_nodes(
    tagesart: Optional[str] = Query("Mo-Fr", description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    time_from: Optional[int] = Query(21600, description="Start time in seconds since midnight (default 06:00)"),
    time_to: Optional[int] = Query(32400, description="End time in seconds since midnight (default 09:00)"),
    x_scenario: str = Header("strategic")
):
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
        
        # We need a temp table connection specific per request since we insert
        # We can just register a python list as a relation in duckdb, or use a VALUES list
        wl_values = ", ".join([f"('{w}')" for w in white_list])
        
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

        query_nodes = f"""
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
                SELECT a.frt_id, a.li_no, a.li_ri_no, rs.li_lfd_nr, rs.stop_text, rs.ideal_stop_nr, a.route_id, a.frt_start, rs.lat, rs.lon
                FROM active_trips a
                JOIN route_stops rs ON a.route_id = rs.route_id
            ),
            hub_counts AS (
                SELECT ideal_stop_nr, MAX(stop_text) as stop_text, COUNT(DISTINCT li_no) as line_count
                FROM trip_sequences
                GROUP BY ideal_stop_nr
            ),
            relevant_nodes AS (
                -- Hubs (>= 2 lines)
                SELECT ideal_stop_nr, stop_text, 'hub' as category FROM hub_counts WHERE line_count >= 2
                UNION
                -- Whitelist (exact/partial text match)
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
                SELECT 
                    r.ideal_stop_nr, 
                    MAX(r.stop_text) as stop_text, 
                    STRING_AGG(DISTINCT r.category, ',') as categories,
                    MAX(lat) as lat,
                    MAX(lon) as lon
                FROM relevant_nodes r
                JOIN route_stops rs ON r.ideal_stop_nr = rs.ideal_stop_nr
                GROUP BY r.ideal_stop_nr
            ),
            -- Edge Calculation
            filtered_sequences AS (
                SELECT ts.frt_id, ts.li_no, ts.li_ri_no, ts.li_lfd_nr, ts.stop_text, ts.ideal_stop_nr, ts.frt_start
                FROM trip_sequences ts
                JOIN final_nodes fn ON ts.ideal_stop_nr = fn.ideal_stop_nr
            ),
            node_pairs AS (
                SELECT 
                    frt_id, li_no, li_ri_no, frt_start,
                    ideal_stop_nr as from_id,
                    LEAD(ideal_stop_nr) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_id
                FROM filtered_sequences
            ),
            abstract_edges AS (
                SELECT 
                    li_no, li_ri_no,
                    from_id, to_id,
                    COUNT(DISTINCT frt_id) as trip_volume
                FROM node_pairs
                WHERE to_id IS NOT NULL AND from_id != to_id
                GROUP BY li_no, li_ri_no, from_id, to_id
            ),
            -- Node Timetable Calculation
            node_timetable AS (
                SELECT 
                    ideal_stop_nr, li_no, li_ri_no,
                    COUNT(DISTINCT frt_id) as total_trips,
                    LIST(MOD(CAST(frt_start / 60 AS INTEGER), 60) ORDER BY frt_start)[1:10] as minutes_sample -- just a sample of departure minutes
                FROM filtered_sequences
                GROUP BY ideal_stop_nr, li_no, li_ri_no
            )
            
            -- We run separate queries in the python side to return a clean dict
            SELECT ideal_stop_nr, stop_text, categories, lat, lon FROM final_nodes;
        """
        
        # Execute Main Queries
        nodes_df = con.execute(query_nodes, where_params).fetchall()
        
        edges_query = f"""
            WITH whitelist AS (
                 SELECT column1 as stop_name FROM (VALUES {wl_values})
            ),
            active_trips AS (
                SELECT s.frt_id, s.route_id, l.li_no, l.li_ri_no, s.li_id, s.frt_start
                FROM cub_schedule s
                JOIN dim_date d ON s.day_id = d.day_id
                JOIN dim_line l ON s.li_id = l.li_id
                {where_sql}
            )...""" # Reusing parts for edge fetching here
            
        # Instead of repeating the big CTE, we execute it in pieces or memory
        # A simpler approach: Just execute the logic using DuckDB statements 
        # that create temp views for the connection cursor, then select from them.
        return {"stub": "not fully implemented string logic here yet"}

    except Exception as e:
        print(f"Network Nodes Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
'''

# The previous logic was too complex to string interpolate easily, 
# I will rewrite it to be a clean Python script that uses con.execute() sequentially
# with temporary views to build up the result cleanly.

content += "\n# The proper version is injected below\n"
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
