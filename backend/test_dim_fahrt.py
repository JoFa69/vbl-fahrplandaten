import duckdb

db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
con = duckdb.connect(db_path, read_only=True)
    
print("--- DESCRIBE dim_fahrt ---")
try:
    print(con.execute("DESCRIBE dim_fahrt").fetchall())
except Exception as e:
    print(e)
    
print("--- DESCRIBE dim_date ---")
try:
    print(con.execute("DESCRIBE dim_date").fetchall())
except Exception as e:
    print(e)
    
print("--- SELECT dim_fahrt ---")
try:
    print(con.execute("SELECT * FROM dim_fahrt LIMIT 2").fetchall())
except Exception as e:
    print(e)
