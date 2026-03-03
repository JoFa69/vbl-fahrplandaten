import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
con = duckdb.connect(db_path, read_only=True)

try:
    print("--- SHOW TABLES ---")
    print(con.execute("SHOW TABLES").fetchall())
    
    print("--- dim_date TAGESARTEN ---")
    query = """
    SELECT DISTINCT tagesart_nr, tagesart_text, tagesart_abbr 
    FROM dim_date 
    ORDER BY tagesart_nr
    """
    print(con.execute(query).fetchall())
    
    # Also check how many days each has in dim_date vs cub_schedule
    print("--- COUNT days per tagesart ---")
    query2 = """
    SELECT 
        d.tagesart_nr, 
        d.tagesart_text, 
        COUNT(DISTINCT d.day_id) as total_days_in_calendar,
        COUNT(DISTINCT s.day_id) as days_with_trips
    FROM dim_date d
    LEFT JOIN cub_schedule s ON d.day_id = s.day_id
    GROUP BY 1, 2
    ORDER BY 1
    """
    print(con.execute(query2).fetchall())

except Exception as e:
    print(f"Error: {e}")
