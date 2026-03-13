import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)
print("--- Depots in dim_ort ---")
res = con.execute("SELECT * FROM dim_ort WHERE LOWER(stop_name) LIKE '%depot%' OR LOWER(stop_name) LIKE '%garage%' OR LOWER(stop_ort) LIKE '%depot%' OR LOWER(stop_ort) LIKE '%garage%'").fetchall()
for r in res:
    print(r)

print("\n--- fahrt types ---")
res2 = con.execute("SELECT fahrt_typ, COUNT(*) FROM dim_fahrt GROUP BY fahrt_typ").fetchall()
for r in res2:
    print(r)
    
print("\n--- Sample of fahrt_typ 2 or 3 (if any) ---")
res3 = con.execute("SELECT * FROM dim_fahrt WHERE fahrt_typ > 1 LIMIT 5").fetchall()
for r in res3:
    print(r)
