import os
import duckdb
from dotenv import load_dotenv

load_dotenv("backend/.env")

def check():
    md_token = os.environ.get("MOTHERDUCK_TOKEN")
    con = duckdb.connect(f"md:VBL_Fahrplandaten?motherduck_token={md_token}")
    schemas = con.execute("SHOW SCHEMAS").fetchall()
    print("Schemas in VBL_Fahrplandaten:")
    for s in schemas:
        print(f"- {s[1]}") # s[0] is database, s[1] is schema name
    con.close()

if __name__ == "__main__":
    check()
