import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
con.execute("ATTACH 'vdv_schedule.duckdb' AS vdv (READ_ONLY);")

query = """
SELECT UM_UID, COUNT(*), MIN(FZG_TYP_NR), MAX(FZG_TYP_NR) 
FROM vdv.rec_umlauf 
GROUP BY UM_UID 
LIMIT 5
"""
try:
    print(con.execute(query).df())
except Exception as e:
    print(e)
    
con.close()
