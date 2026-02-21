
import duckdb
import pandas as pd

def check_names():
    con = duckdb.connect(database='20261231_fahrplandaten_2027.db', read_only=True)
    
    # Get a sample route
    route_id = con.execute("SELECT route_id FROM dim_route LIMIT 1").fetchone()[0]
    print(f"Checking Route ID: {route_id}")
    
    query = """
        SELECT 
            r.li_lfd_nr as seq,
            r.ideal_stop_nr as code,
            r.ideal_stop_text as route_name,
            o.stop_text as ort_name,
            o.stop_id as ort_id
        FROM dim_route r
        LEFT JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
        WHERE r.route_id = ?
        ORDER BY r.li_lfd_nr
        LIMIT 10
    """
    
    df = con.execute(query, [route_id]).fetchdf()
    print(df.to_string())
    
    con.close()

if __name__ == "__main__":
    check_names()
