import duckdb
import os

# Paths relative to where uvicorn is run (usually from backend root)
# The files are in the root project directory, not in data/
DB_PATHS = {
    "strategic": os.path.join(os.path.dirname(__file__), "..", "..", "20261231_fahrplandaten_2027.db"),
    "operative": os.path.join(os.path.dirname(__file__), "..", "..", "operative_transformed.db") # Placeholder
}

class Database:
    _instances = {}

    @classmethod
    def get_connection(cls, scenario="strategic"):
        # Validate scenario
        if scenario not in DB_PATHS:
            raise ValueError(f"Unknown scenario: {scenario}")
            
        db_path = DB_PATHS[scenario]
        
        if scenario not in cls._instances:
            if not os.path.exists(db_path):
                raise FileNotFoundError(f"Database for scenario '{scenario}' not found at {db_path}")
            # Connect in read-only mode for API to strictly read data
            cls._instances[scenario] = duckdb.connect(db_path, read_only=True)
            
        # Return a thread-local cursor from the scenario connection
        return cls._instances[scenario].cursor()

def get_db(scenario="strategic"):
    return Database.get_connection(scenario)
