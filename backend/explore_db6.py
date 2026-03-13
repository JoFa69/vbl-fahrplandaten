import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)

query = """
SELECT 
    f.fahrt_typ,
    cs.umlauf_id,
    cs.start_stop_id,
    cs.end_stop_id,
    cs.frt_start,
    cs.frt_ende,
    cs.li_id
FROM cub_schedule cs
JOIN dim_fahrt f ON cs.frt_id = f.frt_id
WHERE f.fahrt_typ > 1
LIMIT 10
"""
try:
    res = con.execute(query).fetchall()
    for r in res:
        print(r)
except Exception as e:
    print(e)
