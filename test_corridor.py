import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)
q = """
    SELECT f.FAHRTART_NR, m.FAHRTART_TXT, COUNT(*) as anzahl
    FROM operative_transformed.db AS cub
"""
# Wait, I am querying the 'strategic' DB which is `20261231_fahrplandaten_2027.db`
# Is FAHRTART_NR stored in `cub_schedule`? 
# Looking at the CREATE TABLE for `cub_schedule`, `FAHRTART_NR` was NOT included.
