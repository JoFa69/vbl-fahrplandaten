import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
con.execute("ATTACH 'vdv_schedule.duckdb' AS vdv (READ_ONLY);")

print("--- dim_umlauf sample ---")
print(con.execute("SELECT * FROM dim_umlauf LIMIT 5").df())

print("\n--- vdv.rec_umlauf sample ---")
print(con.execute("SELECT * FROM vdv.rec_umlauf LIMIT 5").df())

con.close()
