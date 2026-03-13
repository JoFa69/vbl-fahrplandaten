import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
con.execute("ATTACH 'vdv_schedule.duckdb' AS vdv (READ_ONLY);")

query = """
SELECT 
    cs.umlauf_id, 
    cs.day_id,
    cs.frt_id,
    r.FZG_TYP_NR, 
    m.FZG_TYP_TEXT,
    COUNT(*) OVER () as total_matches
FROM cub_schedule cs
JOIN vdv.rec_umlauf r ON cs.umlauf_id = r.UM_UID 
    -- rec_umlauf depends on day type? TAGESART_NR is in there
LEFT JOIN vdv.menge_fzg_typ m ON r.FZG_TYP_NR = m.FZG_TYP_NR
LIMIT 10
"""
try:
    print(con.execute(query).df())
except Exception as e:
    print(e)
    
con.close()
