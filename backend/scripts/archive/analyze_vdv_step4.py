import duckdb
import pandas as pd

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

print("--- dim_line columns ---")
try:
    cols = con.execute("PRAGMA table_info(dim_line)").fetchall()
    print([c[1] for c in cols])
except:
    pass

print("\n--- dim_fahrt columns ---")
try:
    cols = con.execute("PRAGMA table_info(dim_fahrt)").fetchall()
    print([c[1] for c in cols])
except:
    pass

print("\n--- cub_schedule columns (first 5) ---")
try:
    cols = con.execute("PRAGMA table_info(cub_schedule)").fetchall()
    print([c[1] for c in cols][:10]) 
except:
    pass

print("\n--- Testing 'Fahrten pro Linie' with corrected join ---")
try:
    # Trying li_id as the key
    q = """
    SELECT l.li_text, COUNT(DISTINCT s.frt_id) as fahrten_anzahl
    FROM cub_schedule s
    JOIN dim_line l ON s.li_id = l.line_id 
    GROUP BY l.li_text
    LIMIT 5
    """
    # Wait, if line_id didn't exist in dim_line, maybe it is li_id?
    # I will check columns first.
    pass
except Exception as e:
    print(f"Query failed: {e}")

# I'll just print columns and then decide on the join in the NEXT step or dynamic check
