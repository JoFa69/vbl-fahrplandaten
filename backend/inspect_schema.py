import duckdb
import os

# Adjust path based on database.py
DB_PATH = os.path.join("data", "vdv_schedule.duckdb")

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    # Try alternate path seen in file list
    DB_PATH = "20261231_fahrplandaten_2027.db"
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH} either.")
        exit(1)

print(f"Connecting to {DB_PATH}...")
con = duckdb.connect(DB_PATH, read_only=True)

# List tables
tables = con.execute("SHOW TABLES").fetchall()
print("Tables found:")
for table in tables:
    print(f"- {table[0]}")
    # Describe table
    columns = con.execute(f"DESCRIBE {table[0]}").fetchall()
    for col in columns:
        print(f"  - {col[0]}: {col[1]}")
