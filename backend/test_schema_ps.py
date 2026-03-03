import duckdb
import os

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
    exit(1)

try:
    con = duckdb.connect(db_path, read_only=True)
    print("Verbindung erfolgreich.")
    
    tables = con.execute("SHOW TABLES").fetchall()
    print("--- Check Tables ---")
    print([t[0] for t in tables])
    
    if "cub_schedule" in [t[0] for t in tables]:
        print("--- DESCRIBE cub_schedule ---")
        print(con.execute("DESCRIBE cub_schedule").fetchall())
    
    if "dim_line" in [t[0] for t in tables]:
        print("--- DESCRIBE dim_line ---")
        print(con.execute("DESCRIBE dim_line").fetchall())
        
except Exception as e:
    print(f"Fehler bei Verbindung/Abfrage: {e}")
