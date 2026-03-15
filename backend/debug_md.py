import duckdb
import os
from dotenv import load_dotenv

load_dotenv()

LOCAL_DB_PATH = '20261231_fahrplandaten_2027.db'
MD_TOKEN = os.environ.get("MOTHERDUCK_TOKEN")

def debug():
    print(f"Token length: {len(MD_TOKEN) if MD_TOKEN else 0}")
    
    try:
        print("Attempting connection to MotherDuck...")
        con = duckdb.connect(f"md:?motherduck_token={MD_TOKEN}")
        print("Connection successful!")
        
        print("Listing databases:")
        print(con.execute("SHOW DATABASES").df())
        
        con.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
