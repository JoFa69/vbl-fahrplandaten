import duckdb
import time

def test_edges():
    con = duckdb.connect('c:/Users/Joche/OneDrive/Desktop/VBL Fahrplandaten/20261231_fahrplandaten_2027.db', read_only=True)
    
    # 1. Define Whitelist
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
    
    # Insert whitelist into temp table
    con.execute("CREATE TEMP TABLE whitelist (stop_name VARCHAR)")
    con.executemany("INSERT INTO whitelist VALUES (?)", [[w] for w in white_list])
    
    print("--- 1. Identify Nodes ---")
    start_time = time.time()
    # Complex query to find nodes and build abstract edges
    # Abstract edges logic:
    # 1. We know which stops are "Nodes"
    # 2. For every trip (frt_id), we look at its sequence of stops
    # 3. We filter the sequence to KEEP ONLY stops that are in our "Nodes" list, maintaining their arrival/departure order
    # 4. Using LEAD(), we pair each node with the NEXT node in the sequence to form an edge.
    
    query = """
    WITH active_trips AS (
        SELECT s.frt_id, s.route_id, l.li_no, l.li_ri_no, s.li_id
        FROM cub_schedule s
        JOIN dim_date d ON s.day_id = d.day_id
        JOIN dim_line l ON s.li_id = l.li_id
        WHERE d.tagesart_abbr = 'Mo-Fr'
        AND s.frt_start BETWEEN 21600 AND 32400 -- 06:00 to 09:00
    ),
    route_stops AS (
        SELECT r.route_id, r.li_lfd_nr, o.stop_point_text as stop_text, r.ideal_stop_nr
        FROM dim_route r
        JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
        WHERE o.stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
        QUALIFY ROW_NUMBER() OVER (PARTITION BY r.route_id, r.li_lfd_nr ORDER BY o.stop_point_no) = 1
    ),
    trip_sequences AS (
        SELECT a.frt_id, a.li_no, a.li_ri_no, rs.li_lfd_nr, rs.stop_text, rs.ideal_stop_nr, a.route_id
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
        -- Whitelist (exact text match for now, could be improved)
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
         SELECT ideal_stop_nr, MAX(stop_text) as stop_text, STRING_AGG(DISTINCT category, ',') as categories
         FROM relevant_nodes
         GROUP BY ideal_stop_nr
    ),
    -- Filter sequences to ONLY include relevant nodes
    filtered_sequences AS (
        SELECT ts.frt_id, ts.li_no, ts.li_ri_no, ts.li_lfd_nr, ts.stop_text, ts.ideal_stop_nr
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
            LEAD(ideal_stop_nr) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_id
        FROM filtered_sequences
    ),
    abstract_edges AS (
        SELECT 
            li_no, li_ri_no,
            from_node, to_node,
            from_id, to_id,
            COUNT(DISTINCT frt_id) as trip_volume
        FROM node_pairs
        WHERE to_node IS NOT NULL AND from_node != to_node
        GROUP BY li_no, li_ri_no, from_node, to_node, from_id, to_id
    )
    SELECT * FROM abstract_edges ORDER BY trip_volume DESC LIMIT 20;
    """
    
    edges_df = con.execute(query).df()
    print(f"Edges query completed in {time.time() - start_time:.2f} seconds")
    print(edges_df.to_string())

test_edges()
