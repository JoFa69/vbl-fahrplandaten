import duckdb
import os

# Path relative to where uvicorn is run (usually from backend root)
# The file is in the root project directory, not in data/
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "20261231_fahrplandaten_2027.db")

class Database:
    _instance = None

    @classmethod
    def get_connection(cls):
         # Connect in read-only mode for API to strictly read data
         # Check if file exists to avoid creating a new one implicitly if path is wrong
        if not cls._instance:
            if not os.path.exists(DB_PATH):
                raise FileNotFoundError(f"Database not found at {DB_PATH}")
            cls._instance = duckdb.connect(DB_PATH, read_only=True)
        # Return a thread-local cursor from the single connection
        return cls._instance.cursor()

def get_db():
    return Database.get_connection()
