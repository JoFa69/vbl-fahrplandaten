import duckdb

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

def inspect_table(name):
    print(f"\nInspecting {name} columns:")
    try:
        cols = con.execute(f"PRAGMA table_info({name})").fetchall()
        for c in cols:
            print(f" - {c[1]} ({c[2]})")
    except:
        print(f"Could not inspect {name}")

inspect_table("dim_fahrt")
inspect_table("cub_route")
inspect_table("dim_ort")

print("\n--- Testing 'Fahrten pro Linie' ---")
try:
    # Try joining dim_fahrt and dim_line
    # Guessing join keys: dim_fahrt.line_id = dim_line.line_id?
    q = """
    SELECT l.line_no, COUNT(*) as fahrten_anzahl
    FROM dim_fahrt f
    JOIN dim_line l ON f.line_id = l.line_id
    GROUP BY l.line_no
    LIMIT 5
    """
    print(con.execute(q).fetchdf())
except Exception as e:
    print(f"Query failed: {e}")

print("\n--- Testing 'Maximal-Abschnitt' (Segments) ---")
# Need to find where stop sequences are.
# Check if cub_route has stop info.
try:
    q = "SELECT * FROM cub_route LIMIT 5"
    print(con.execute(q).fetchdf())
except:
    pass
