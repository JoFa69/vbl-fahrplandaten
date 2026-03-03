import duckdb
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "20261231_fahrplandaten_2027.db")

def migrate_dim_ort():
    print(f"Migrating {DB_PATH}...")
    
    # We cannot open if the API is using it, but we'll try to get an exclusive lock.
    try:
        con = duckdb.connect(DB_PATH)
    except Exception as e:
        print(f"Error connecting to database. Is the backend server running? Please stop it first. Exception: {e}")
        return

    # Check if columns already exist
    cols = [x[0] for x in con.execute("DESCRIBE dim_ort").fetchall()]
    
    if 'stop_ort' not in cols:
        print("Adding column 'stop_ort'...")
        con.execute("ALTER TABLE dim_ort ADD COLUMN stop_ort VARCHAR")
        
    if 'stop_name' not in cols:
        print("Adding column 'stop_name'...")
        con.execute("ALTER TABLE dim_ort ADD COLUMN stop_name VARCHAR")

    print("Updating 'stop_ort' and 'stop_name' using heuristic...")
    
    # Update heuristic using DuckDB's string functions
    query = """
    UPDATE dim_ort
    SET 
        stop_ort = CASE 
            WHEN stop_point_text LIKE '%,%' THEN trim(split_part(stop_point_text, ',', 1))
            WHEN stop_point_text LIKE '%-%' AND stop_point_text NOT LIKE '% %' THEN trim(split_part(stop_point_text, '-', 1))
            ELSE 
                CASE 
                    WHEN split_part(stop_point_text, ' ', 1) = 'St.' THEN split_part(stop_point_text, ' ', 1) || ' ' || split_part(stop_point_text, ' ', 2)
                    ELSE split_part(stop_point_text, ' ', 1)
                END
                || CASE WHEN stop_point_text LIKE '% LU %' OR stop_point_text LIKE '%LU %' THEN ' LU' ELSE '' END
        END,
        stop_name = CASE 
            WHEN stop_point_text LIKE '%,%' THEN trim(substring(stop_point_text, length(split_part(stop_point_text, ',', 1)) + 2))
            WHEN stop_point_text LIKE '%-%' AND stop_point_text NOT LIKE '% %' THEN trim(substring(stop_point_text, length(split_part(stop_point_text, '-', 1)) + 2))
            WHEN stop_point_text NOT LIKE '% %' THEN stop_point_text
            ELSE 
                CASE 
                    WHEN split_part(stop_point_text, ' ', 1) = 'St.' THEN trim(substring(stop_point_text, length(split_part(stop_point_text, ' ', 1) || ' ' || split_part(stop_point_text, ' ', 2)) + 2))
                    ELSE trim(substring(stop_point_text, length(split_part(stop_point_text, ' ', 1)) + 2))
                END
        END
    """
    
    # We will refine the SQL using a Python UDF which is much easier to maintain and matches our previous test perfect
    con.execute("""
        CREATE OR REPLACE MACRO get_ort(text) AS
        CASE 
            WHEN text LIKE '%,%' THEN trim(split_part(text, ',', 1))
            WHEN text LIKE '%-%' AND text NOT LIKE '% %' THEN trim(split_part(text, '-', 1))
            WHEN split_part(text, ' ', 1) = 'St.' THEN 
                split_part(text, ' ', 1) || ' ' || split_part(text, ' ', 2) || 
                CASE WHEN split_part(text, ' ', 3) = 'LU' THEN ' LU' ELSE '' END
            ELSE 
                split_part(text, ' ', 1) || 
                CASE WHEN split_part(text, ' ', 2) = 'LU' THEN ' LU' ELSE '' END
        END
    """)
    
    con.execute("""
        CREATE OR REPLACE MACRO get_name(text) AS
        CASE 
            WHEN text LIKE '%,%' THEN trim(substring(text, length(split_part(text, ',', 1)) + 2))
            WHEN text LIKE '%-%' AND text NOT LIKE '% %' THEN trim(substring(text, length(split_part(text, '-', 1)) + 2))
            WHEN text NOT LIKE '% %' THEN text
            WHEN split_part(text, ' ', 1) = 'St.' THEN 
                trim(substring(text, length(get_ort(text)) + 1))
            ELSE 
                trim(substring(text, length(get_ort(text)) + 1))
        END
    """)

    con.execute("""
        UPDATE dim_ort
        SET 
            stop_ort = get_ort(stop_point_text),
            stop_name = CASE WHEN get_name(stop_point_text) = '' THEN stop_point_text ELSE get_name(stop_point_text) END
    """)

    # Clean up empty names
    con.execute("UPDATE dim_ort SET stop_name = stop_point_text WHERE stop_name = ''")
    # Clean up extra LU in stop_name if it was consumed by Ort
    con.execute("UPDATE dim_ort SET stop_name = trim(substring(stop_name, 4)) WHERE stop_name LIKE 'LU %'")

    count = con.execute("SELECT count(*) FROM dim_ort").fetchone()[0]
    print(f"Migration complete. Updated {count} rows.")
    
    # Print sample
    print("Sample updates:")
    sample = con.execute("SELECT stop_point_text, stop_ort, stop_name FROM dim_ort LIMIT 20").df()
    print(sample)
    
    con.close()

if __name__ == "__main__":
    migrate_dim_ort()
