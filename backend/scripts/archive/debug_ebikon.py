import duckdb
con = duckdb.connect('20261231_fahrplandaten_2027.db')
print(con.execute("SELECT DISTINCT stop_point_text FROM dim_ort WHERE stop_point_text LIKE 'Ebikon%' LIMIT 20").fetchall())
