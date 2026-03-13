import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)

print("\n--- Try to join pull-out (fahrt_typ 2 or 3) with schedule ---")
query = """
SELECT 
    f.fahrt_typ,
    u.umlauf_kuerzel,
    o_start.stop_name as start_depot,
    o_end.stop_name as end_depot,
    cs.frt_start,
    cs.frt_ende
FROM dim_fahrt f
JOIN cub_schedule cs ON f.frt_id = cs.frt_id
JOIN dim_umlauf u ON cs.umlauf_id = u.umlauf_id
LEFT JOIN dim_ort o_start ON cs.start_stop_id = o_start.stop_id
LEFT JOIN dim_ort o_end ON cs.end_stop_id = o_end.stop_id
WHERE f.fahrt_typ > 1 
LIMIT 10
"""
try:
    res = con.execute(query).fetchall()
    for r in res:
        print(r)
except Exception as e:
    print(e)
