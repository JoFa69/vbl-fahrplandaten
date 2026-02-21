import duckdb
con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
tabs=[x[0] for x in con.execute('SHOW TABLES').fetchall()]
print(f'{len(tabs)} tables found')
for t in tabs:
    try:
        count = con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
        cols = [x[0] for x in con.execute(f'DESCRIBE "{t}"').fetchall()]
        print(f'{t}: {count} rows, {len(cols)} cols')
    except Exception as e:
        print(f'Error on {t}: {e}')
