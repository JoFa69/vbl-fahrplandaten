import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)

print("--- cub_schedule ---")
try:
    cols = con.execute("PRAGMA table_info('cub_schedule')").fetchall()
    for c in cols:
        print(c)
except Exception as e:
    print(e)
    
print("\n--- Try to join pull-out (fahrt_typ 2 or 3) with schedule ---")
query = """
SELECT 
    f.fahrt_typ,
    u.umlauf_no,
    u.umlauf_kuerzel,
    o.stop_name as depot_name,
    cs.abfahrt
FROM dim_fahrt f
JOIN cub_schedule cs ON f.frt_id = cs.frt_id
JOIN dim_umlauf u ON cs.umlauf_id = u.umlauf_id
JOIN dim_ort o ON cs.stop_id = o.stop_id
WHERE f.fahrt_typ > 1 
LIMIT 10
"""
try:
    res = con.execute(query).fetchall()
    for r in res:
        print(r)
except Exception as e:
    print(e)
