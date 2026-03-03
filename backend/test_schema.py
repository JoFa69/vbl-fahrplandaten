import duckdb

try:
    con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)
    print("Verbindung erfolgreich.")
except Exception as e:
    print(f"Fehler bei Verbindung: {e}")

print("--- DESCRIBE v_rec_frt ---")
try:
    print(con.execute("DESCRIBE v_rec_frt").fetchall())
except Exception as e:
    print(e)
    
print("--- DESCRIBE rec_lid ---")
try:
    print(con.execute("DESCRIBE rec_lid").fetchall())
except Exception as e:
    print(e)
    
print("--- Check Lines ---")
try:
    print(con.execute("SELECT DISTINCT LI_NR, LIDNAME FROM rec_lid LIMIT 5").fetchall())
except Exception as e:
    print(e)
    
print("--- Heatmap Query Test ---")
query_heatmap = """
    SELECT 
        l.LI_NR,
        CAST(TRY_CAST(s.FRT_START AS INTEGER) / 3600 AS INTEGER) as hour,
        s.TAGESART_NR as tagesart,
        l.LI_RI_NR as direction,
        COUNT(DISTINCT s.FRT_FID) as trip_count
    FROM v_rec_frt s
    JOIN rec_lid l ON s.LI_NR = l.LI_NR AND s.STR_LI_VAR = l.STR_LI_VAR
    WHERE l.LI_NR = '1'
    GROUP BY 1, 2, 3, 4
    ORDER BY hour
    LIMIT 5
"""
try:
    print(con.execute(query_heatmap).fetchall())
except Exception as e:
    print(f"Heatmap Error: {e}")
