import duckdb

def check_db(db_name):
    print(f"\n=== Checking {db_name} ===")
    con = duckdb.connect(db_name, read_only=True)
    
    # All lines
    lines = con.execute("SELECT DISTINCT li_no FROM dim_line ORDER BY li_no").fetchall()
    print(f"Lines found: {[l[0] for l in lines]}")
    
    # Specifically search for 101-106
    night_lines = con.execute("SELECT * FROM dim_line WHERE li_no IN ('101', '102', '103', '104', '105', '106')").fetchall()
    print(f"Target lines (101-106): {night_lines}")
    
    # Asymmetry check
    asymmetry_query = """
    WITH aus AS (
        SELECT cs.umlauf_id, cs.day_id, cs.start_stop_id, o.stop_name as aus_name
        FROM cub_schedule cs 
        JOIN dim_fahrt f ON cs.frt_id = f.frt_id 
        JOIN dim_ort o ON cs.start_stop_id = o.stop_id
        WHERE f.fahrt_typ = 2
    ), ein AS (
        SELECT cs.umlauf_id, cs.day_id, cs.end_stop_id, o.stop_name as ein_name
        FROM cub_schedule cs 
        JOIN dim_fahrt f ON cs.frt_id = f.frt_id 
        JOIN dim_ort o ON cs.end_stop_id = o.stop_id
        WHERE f.fahrt_typ = 3
    ) 
    SELECT aus.umlauf_id, aus.day_id, aus.aus_name, ein.ein_name 
    FROM aus 
    JOIN ein ON aus.umlauf_id = ein.umlauf_id AND aus.day_id = ein.day_id 
    WHERE aus.start_stop_id != ein.end_stop_id
    LIMIT 10
    """
    asymmetric_results = con.execute(asymmetry_query).fetchall()
    print(f"Asymmetric umlaufs found: {len(asymmetric_results)}")
    for res in asymmetric_results:
        print(f"  Umlauf {res[0]} (Day {res[1]}): {res[2]} -> {res[3]}")
    
    con.close()

check_db('20261231_fahrplandaten_2027.db')
check_db('operative_transformed.db')
