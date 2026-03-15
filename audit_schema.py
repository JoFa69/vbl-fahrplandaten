import duckdb
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

DB_PATHS = {
    "strategic": '20261231_fahrplandaten_2027.db',
    "operative": 'operative_transformed.db'
}
MD_TOKEN = os.environ.get("MOTHERDUCK_TOKEN")

def audit():
    results = {}
    
    # Check Local
    for scenario, path in DB_PATHS.items():
        if os.path.exists(path):
            con = duckdb.connect(path, read_only=True)
            cols = [c[0] for c in con.execute("DESCRIBE cub_schedule").fetchall()]
            results[f"local_{scenario}"] = cols
            con.close()
        else:
            results[f"local_{scenario}"] = "File not found"

    # Check MotherDuck
    if MD_TOKEN:
        try:
            con = duckdb.connect(f"md:VBL_Fahrplandaten?motherduck_token={MD_TOKEN}")
            cols = [c[0] for c in con.execute("DESCRIBE cub_schedule").fetchall()]
            results["motherduck"] = cols
            con.close()
        except Exception as e:
            results["motherduck"] = str(e)

    for src, cols in results.items():
        print(f"\n--- {src} ---")
        if isinstance(cols, list):
            print(", ".join(cols))
        else:
            print(cols)

if __name__ == "__main__":
    audit()
