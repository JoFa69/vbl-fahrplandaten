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

    print(f"\n--- Checking {t} ---")
    
    # Total umlaufs identified
    valid_umlaufs_query = f"SELECT COUNT(DISTINCT cs.umlauf_id) FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause}"
    umlauf_count = con.execute(valid_umlaufs_query).fetchone()[0]
    print(f"Total valid umlaufs: {umlauf_count}")

    # Ausfahrten count
    aus_query = f"""
    WITH vu AS (SELECT DISTINCT cs.umlauf_id FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause})
    SELECT COUNT(DISTINCT cs.umlauf_id) 
    FROM cub_schedule cs 
    JOIN vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    WHERE f.fahrt_typ = 2
    """
    aus_count = con.execute(aus_query).fetchone()[0]
    
    # Einfahrten count
    ein_query = f"""
    WITH vu AS (SELECT DISTINCT cs.umlauf_id FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause})
    SELECT COUNT(DISTINCT cs.umlauf_id) 
    FROM cub_schedule cs 
    JOIN vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    WHERE f.fahrt_typ = 3
    """
    ein_count = con.execute(ein_query).fetchone()[0]
    
    print(f"Ausfahrten (Typ 2): {aus_count}")
    print(f"Einfahrten (Typ 3): {ein_count}")
    
    # Night lines check (usually have a large line number or specific prefix/pattern, or fahrt_typ 4/5/etc?)
    # Actually, night lines in VBL are usually N1, N2...
    night_lines_query = f"""
    WITH vu AS (SELECT DISTINCT cs.umlauf_id FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id {where_clause})
    SELECT DISTINCT l.li_no
    FROM cub_schedule cs
    JOIN vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_line l ON cs.li_id = l.li_id
    WHERE l.li_no LIKE 'N%'
    """
    night_lines = con.execute(night_lines_query).fetchall()
    print(f"Night lines found: {[nl[0] for nl in night_lines]}")

con.close()
