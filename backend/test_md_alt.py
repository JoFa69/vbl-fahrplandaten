import duckdb
import os
from dotenv import load_dotenv

load_dotenv()

MD_TOKEN = os.environ.get("MOTHERDUCK_TOKEN")

def test():
    try:
        print("Connecting to md:...")
        con = duckdb.connect("md:")
        print("Setting token via SET...")
        con.execute(f"SET motherduck_token='{MD_TOKEN}'")
        print("Token set successfully!")
        
        # Check databases
        print("Listing databases...")
        print(con.execute("SHOW DATABASES").df())
        
        con.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
