import duckdb
import os
from dotenv import load_dotenv

# Load local .env
load_dotenv("backend/.env")

DB_PATHS = {
    "strategic": '20261231_fahrplandaten_2027.db',
    "operative": 'operative_transformed.db'
}
MD_TOKEN = os.environ.get("MOTHERDUCK_TOKEN")

def sync():
    if not MD_TOKEN:
        print("Error: MOTHERDUCK_TOKEN not found in .env")
        return

    print(f"Connecting to MotherDuck...")
    md_con = duckdb.connect(f"md:VBL_Fahrplandaten?motherduck_token={MD_TOKEN}")
    
    # Ensure database exists
    md_con.execute("CREATE DATABASE IF NOT EXISTS VBL_Fahrplandaten")
    
    for scenario, relative_path in DB_PATHS.items():
        if not os.path.exists(relative_path):
            print(f"Warning: Local database {relative_path} not found. Skipping.")
            continue
            
        print(f"\n--- Syncing {scenario} ({relative_path}) ---")
        abs_path = os.path.abspath(relative_path)
        
        # Ensure schema exists in MotherDuck
        md_con.execute(f"CREATE SCHEMA IF NOT EXISTS VBL_Fahrplandaten.{scenario}")
        
        # Attach local db
        temp_alias = f"db_{scenario}"
        md_con.execute(f"ATTACH '{abs_path}' AS {temp_alias} (READ_ONLY)")
        
        # Get tables
        tables = md_con.execute(f"SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_catalog = '{temp_alias}'").fetchall()
        
        for (table_name,) in tables:
            print(f"  Uploading table: {table_name} to schema {scenario}...")
            # We use CREATE OR REPLACE to ensure we have the latest version
            md_con.execute(f"CREATE OR REPLACE TABLE VBL_Fahrplandaten.{scenario}.{table_name} AS SELECT * FROM {temp_alias}.main.{table_name}")
        
        md_con.execute(f"DETACH {temp_alias}")
    
    print("\nSync complete!")
    md_con.close()

if __name__ == "__main__":
    sync()
