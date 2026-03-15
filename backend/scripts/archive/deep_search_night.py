import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

print("--- Day Count Check ---")
day_count = con.execute("SELECT COUNT(DISTINCT d.day_id) FROM dim_date d WHERE (d.tagesart_abbr = 'Mo-Fr' OR d.tagesart_abbr = 'Mo-Do') AND d.wochentag_nr IN (0, 1, 2, 3)").fetchone()[0]
print(f"Days in Mo-Do: {day_count}")

print("\n--- Searching for 101 in all tables ---")
tables = con.execute("PRAGMA show_tables").fetchall()
for t in tables:
    tname = t[0]
    cols = [c[1] for c in con.execute(f"PRAGMA table_info({tname})").fetchall()]
    for c in cols:
        try:
            res = con.execute(f"SELECT COUNT(*) FROM {tname} WHERE CAST({c} AS VARCHAR) LIKE '%101%'").fetchone()[0]
            if res > 0:
                print(f"Found matches in {tname}.{c}: {res}")
        except:
            pass

con.close()
