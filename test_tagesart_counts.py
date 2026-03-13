import duckdb
con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
res = con.execute("SELECT d.wochentag_nr, COUNT(DISTINCT cs.umlauf_id), COUNT(*) FROM cub_schedule cs JOIN dim_date d ON cs.day_id = d.day_id WHERE d.tagesart_abbr = 'Mo-Fr' GROUP BY 1 ORDER BY 1").fetchall()
print(res)
con.close()
