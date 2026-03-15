import duckdb
import os
from dotenv import load_dotenv

# Load local .env
load_dotenv()

LOCAL_DB_PATH = '20261231_fahrplandaten_2027.db'
MD_TOKEN = os.environ.get("MOTHERDUCK_TOKEN")

def migrate():
    if not MD_TOKEN:
        print("Error: MOTHERDUCK_TOKEN not found in .env")
        return

    if not os.path.exists(LOCAL_DB_PATH):
        print(f"Error: Local database {LOCAL_DB_PATH} not found.")
        return

    print(f"Connecting to MotherDuck...")
    # Connect to MotherDuck generally
    md_con = duckdb.connect(f"md:?motherduck_token={MD_TOKEN}")
    
    # Ensure database exists
    print("Ensuring database VBL_Fahrplandaten exists...")
    md_con.execute("CREATE DATABASE IF NOT EXISTS VBL_Fahrplandaten")
    md_con.execute("USE VBL_Fahrplandaten")
    
    print(f"Attaching local database {LOCAL_DB_PATH}...")
    # Use absolute path to avoid any ambiguity
    abs_local_path = os.path.abspath(LOCAL_DB_PATH)
    md_con.execute(f"ATTACH '{abs_local_path}' AS local_db (READ_ONLY)")
    
    # Get list of tables from local DB
    tables = md_con.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_catalog = 'local_db'").fetchall()
    
    for (table_name,) in tables:
        print(f"Migrating table: {table_name}...")
        # Create table in MotherDuck from local table
        md_con.execute(f"CREATE OR REPLACE TABLE VBL_Fahrplandaten.main.{table_name} AS SELECT * FROM local_db.main.{table_name}")
    
    print("Migration complete!")
    md_con.close()

if __name__ == "__main__":
    migrate()
