import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
con = duckdb.connect(db_path, read_only=True)

try:
    print("--- menge_tagesart ---")
    print(con.execute("SELECT * FROM menge_tagesart LIMIT 10").fetchall())
    
    print("--- dim_fahrt ---")
    print(con.execute("DESCRIBE dim_fahrt").fetchall())
    
    # Check if cub_schedule has tagesart
    print("--- cub_schedule + dim_date ---")
    print(con.execute("SELECT DISTINCT d.tagesart_nr, d.tagesart_abbr, d.tagesart_text FROM dim_date d JOIN cub_schedule s ON d.day_id = s.day_id LIMIT 10").fetchall())
    
    # Check rec_frt to see if we can get the actual TAGESART_NR natively
    print("--- rec_frt TAGESART_NR ---")
    query = """
    SELECT s.TAGESART_NR, m.TAGESART_TEXT, COUNT(*) 
    FROM rec_frt s
    LEFT JOIN menge_tagesart m ON s.TAGESART_NR = m.TAGESART_NR
    GROUP BY 1, 2
    ORDER BY 3 DESC
    LIMIT 10
    """
    print(con.execute(query).fetchall())

except Exception as e:
    print(f"Error: {e}")
