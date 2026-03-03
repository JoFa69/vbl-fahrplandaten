import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"

try:
    con = duckdb.connect(db_path, read_only=True)
    
    print("--- dim_date Sample ---")
    print(con.execute("SELECT * FROM dim_date LIMIT 5").fetchall())
    
    print("--- cub_schedule COUNT by tagesart_abbr ---")
    query = """
        SELECT 
            d.tagesart_abbr,
            COUNT(DISTINCT s.day_id) as distinct_days,
            COUNT(DISTINCT s.frt_id) as distinct_trips,
            COUNT(s.schedule_id) as total_schedule_rows
        FROM cub_schedule s
        JOIN dim_date d ON s.day_id = d.day_id
        GROUP BY 1
    """
    print(con.execute(query).fetchall())

except Exception as e:
    print(f"Error: {e}")
