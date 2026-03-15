import duckdb
import os

# Paths relative to the project root
# We use absolute paths to avoid issues with different working directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATHS = {
    "strategic": os.path.join(BASE_DIR, "20261231_fahrplandaten_2027.db"),
    "operative": os.path.join(BASE_DIR, "operative_transformed.db")
}

class Database:
    _instances = {}

    @classmethod
    def get_connection(cls, scenario="strategic"):
        # Detect environment
        is_render = os.environ.get("RENDER") == "true"
        md_token = os.environ.get("MOTHERDUCK_TOKEN")
        
        # Local File Path
        db_path = DB_PATHS.get(scenario)
        local_exists = db_path and os.path.exists(db_path)

        # Logic: 
        # 1. If on Render, MUST use MotherDuck.
        # 2. If locally, use local file if it exists. 
        # 3. If locally and file missing, but token present, use MotherDuck.

        use_motherduck = False
        if is_render:
            use_motherduck = True
        elif not local_exists and md_token:
            use_motherduck = True
        
        if use_motherduck:
            if not md_token:
                raise ValueError(f"MotherDuck token missing in Render/Failover environment for scenario {scenario}")
            
            # Use MotherDuck connection
            if "motherduck" not in cls._instances:
                try:
                    print(f"Connecting to MotherDuck (token: {md_token[:10]}...)...")
                    # Connect to MotherDuck. Database name is 'VBL_Fahrplandaten'
                    con = duckdb.connect(f"md:VBL_Fahrplandaten?motherduck_token={md_token}")
                    cls._instances["motherduck"] = con
                    print("Successfully connected to MotherDuck.")
                except Exception as e:
                    print(f"FAILED to connect to MotherDuck: {e}")
                    raise e
            return cls._instances["motherduck"].cursor()

        # Local File Fallback
        if scenario not in DB_PATHS:
            raise ValueError(f"Unknown scenario: {scenario}")
            
        db_path = DB_PATHS[scenario]
        
        if scenario not in cls._instances:
            if not os.path.exists(db_path):
                # In production (Render), we might not have the file if we rely on MotherDuck.
                # If md_token is missing, we MUST have the file.
                raise FileNotFoundError(f"Database for scenario '{scenario}' not found at {db_path} and MotherDuck token is not set.")
            # Connect in read-only mode for API to strictly read data
            cls._instances[scenario] = duckdb.connect(db_path, read_only=True)
            
        # Return a thread-local cursor from the scenario connection
        return cls._instances[scenario].cursor()

def get_db(scenario="strategic"):
    return Database.get_connection(scenario)
