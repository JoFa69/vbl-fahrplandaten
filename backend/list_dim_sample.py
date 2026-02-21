import duckdb
import os

db_path = "../20261231_fahrplandaten_2027.db"
con = duckdb.connect(db_path, read_only=True)
print("Sample dim_ort:")
res = con.execute("SELECT * FROM dim_ort LIMIT 10").fetchall()
for r in res:
    print(r)
