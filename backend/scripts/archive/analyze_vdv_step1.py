import duckdb
import pandas as pd

con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

def check_metric(name, query):
    print(f"\n--- Checking metric: {name} ---")
    try:
        # Get schema of involved tables if needed, or just run the query
        # We'll just try to run the query and print a sample
        df = con.execute(query).fetchdf()
        print("Status: OK")
        print("Sample Data:")
        print(df.head())
        print(f"Rows returned: {len(df)}")
    except Exception as e:
        print(f"Status: FAILED")
        print(f"Error: {e}")

# 1. Fahrten-Volumen: Fahrten pro Linie/Richtung
# Hypothesis: dim_fahrt has line_id and direction (ri_kz or similar)
# Let's first inspect dim_fahrt columns to be sure
print("Inspecting dim_fahrt columns:")
try:
    cols = con.execute("PRAGMA table_info(dim_fahrt)").fetchall()
    for c in cols:
        print(f" - {c[1]} ({c[2]})")
except:
    print("Could not inspect dim_fahrt")

print("\nInspecting dim_line columns:")
try:
    cols = con.execute("PRAGMA table_info(dim_line)").fetchall()
    for c in cols:
        print(f" - {c[1]} ({c[2]})")
except:
    print("Could not inspect dim_line")

print("\nInspecting dim_route columns:")
try:
    cols = con.execute("PRAGMA table_info(dim_route)").fetchall()
    for c in cols:
        print(f" - {c[1]} ({c[2]})")
except:
    print("Could not inspect dim_route")
    
print("\nInspecting cub_schedule columns:")
try:
    cols = con.execute("PRAGMA table_info(cub_schedule)").fetchall()
    for c in cols:
        print(f" - {c[1]} ({c[2]})")
except:
    print("Could not inspect cub_schedule")

