import duckdb

db_path = '20261231_fahrplandaten_2027.db'
con = duckdb.connect(db_path, read_only=True)

tagesarten = ["Mo-Do", "Fr", "Sa", "So/Ft"]

for t in tagesarten:
    where_clause = ""
    if t == "Mo-Do":
        where_clause = "WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)"
    elif t == "Fr":
        where_clause = "WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr = 4"
    elif t == "Sa":
        where_clause = "WHERE d.tagesart_abbr = 'Sa'"
    elif t == "So/Ft":
        where_clause = "WHERE d.tagesart_abbr = 'So/Ft'"

    print(f"\n--- Final Verification {t} ---")
    
    # Ausfahrten count with composite ID
    aus_query = f"""
    WITH vu AS (SELECT DISTINCT cs.umlauf_id, cs.day_id FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause})
    SELECT COUNT(DISTINCT cs.umlauf_id || '_' || cs.day_id) 
    FROM cub_schedule cs 
    JOIN vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    WHERE f.fahrt_typ = 2
    """
    aus_count = con.execute(aus_query).fetchone()[0]
    
    # Einfahrten count with composite ID
    ein_query = f"""
    WITH vu AS (SELECT DISTINCT cs.umlauf_id, cs.day_id FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause})
    SELECT COUNT(DISTINCT cs.umlauf_id || '_' || cs.day_id) 
    FROM cub_schedule cs 
    JOIN vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    WHERE f.fahrt_typ = 3
    """
    ein_count = con.execute(ein_query).fetchone()[0]
    
    print(f"Symmetric Check: Ausfahrten={aus_count}, Einfahrten={ein_count}")
    if aus_count == ein_count:
        print("✅ SUCCESS: Counts are perfectly symmetric.")
    else:
        print("❌ FAILURE: Counts are still asymmetric.")

con.close()
