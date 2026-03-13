import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)
tables = ['dim_fahrt', 'dim_umlauf', 'cub_route', 'dim_ort', 'dim_vehicle']
for t in tables:
    print(f"\n---{t}---")
    try:
        cols = con.execute(f"PRAGMA table_info('{t}')").fetchall()
        for c in cols:
            print(c)
    except:
        pass
    print("Sample:")
    try:
        rows = con.execute(f"SELECT * FROM {t} LIMIT 1").fetchall()
        for r in rows:
            print(r)
    except:
        pass
