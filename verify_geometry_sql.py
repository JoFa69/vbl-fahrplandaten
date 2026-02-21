
import duckdb

def verify_sql():
    con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
    
    print("1. Verifying Stats Query...")
    try:
        lines = con.execute("SELECT COUNT(DISTINCT li_no) FROM dim_line").fetchone()[0]
        stops = con.execute("SELECT COUNT(DISTINCT stop_no) FROM dim_ort").fetchone()[0]
        trips = con.execute("SELECT COUNT(*) FROM cub_schedule").fetchone()[0]
        print(f"   -> Lines: {lines}, Stops: {stops}, Trips: {trips} [OK]")
    except Exception as e:
        print(f"   -> [ERROR] {e}")

    print("\n2. Verifying Geometry Variants Query...")
    # Get a valid line_id first
    line_id = con.execute("SELECT li_id FROM dim_line LIMIT 1").fetchone()[0]
    print(f"   -> Testing with Line ID: {line_id}")
    
    query = """
        WITH route_stops AS (
            SELECT 
                route_id,
                MIN(li_lfd_nr) as min_seq,
                MAX(li_lfd_nr) as max_seq
            FROM dim_route
            GROUP BY route_id
        ),
        start_stop AS (
            SELECT r.route_id, r.ideal_stop_text as name
            FROM dim_route r JOIN route_stops rs ON r.route_id = rs.route_id
            WHERE r.li_lfd_nr = rs.min_seq
        ),
        end_stop AS (
            SELECT r.route_id, r.ideal_stop_text as name
            FROM dim_route r JOIN route_stops rs ON r.route_id = rs.route_id
            WHERE r.li_lfd_nr = rs.max_seq
        ),
        route_volume AS (
            SELECT route_id, COUNT(*) as volume
            FROM cub_schedule
            WHERE li_id = ?
            GROUP BY route_id
        )
        SELECT DISTINCT 
            r.route_id, 
            r.route_hash,
            l.li_no,
            l.li_var_no,
            l.li_ri_no,
            COALESCE(s.name, '?') || ' - ' || COALESCE(e.name, '?') as route_info,
            (SELECT count(*) FROM dim_route WHERE route_id = r.route_id) as stop_count,
            COALESCE(v.volume, 0) as volume
        FROM dim_route r
        JOIN cub_schedule cs ON r.route_id = cs.route_id
        JOIN dim_line l ON cs.li_id = l.li_id
        LEFT JOIN start_stop s ON r.route_id = s.route_id
        LEFT JOIN end_stop e ON r.route_id = e.route_id
        LEFT JOIN route_volume v ON r.route_id = v.route_id
        WHERE cs.li_id = ?
        LIMIT 5
    """
    
    try:
        res = con.execute(query, [line_id, line_id]).fetchall()
        if res:
            print("   -> [SUCCESS] Query returned data:")
            for r in res:
                print(f"      - ID: {r[0]}")
                print(f"      - Hash: {r[1]}")
                print(f"      - Line No: {r[2]}")
                print(f"      - Var No: {r[3]}")
                print(f"      - Direction: {r[4]}")
                print(f"      - Route Info: {r[5]}")
                print(f"      - Stop Count: {r[6]}")
                print(f"      - Volume: {r[7]}")
                print("      ---")
        else:
            print("   -> [WARNING] Query returned no data (might be acceptable if line has no schedule).")
    except Exception as e:
        print(f"   -> [ERROR] {e}")

    con.close()

if __name__ == "__main__":
    verify_sql()
