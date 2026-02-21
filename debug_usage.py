
import duckdb

def debug_cleanup_verification():
    print("Verifying cleanup of 'Zombie' IDs (11903, 11907, 11908, 11910) in Main DB...")
    
    con_main = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
    
    zombies = [11903, 11907, 11908, 11910]
    
    # Check dim_ort
    print("\nZombies in dim_ort (Should be EMPTY):")
    res = con_main.execute(f"SELECT ort_nr, stop_text, lat, lon FROM dim_ort WHERE ort_nr IN {tuple(zombies)}").fetchall()
    if not res:
        print("  [SUCCESS] No zombies found.")
    else:
        for r in res:
            print(f"  [FAIL] Found zombie: {r}")
            
    # Check Luzern Bahnhof coordinates
    print("\nChecking 'Luzern, Bahnhof' coordinates (Should be ~47.05):")
    res = con_main.execute("SELECT ort_nr, stop_text, lat, lon FROM dim_ort WHERE stop_text LIKE '%Luzern, Bahnhof%' LIMIT 5").fetchall()
    for r in res:
        print(r)
        
    con_main.close()

if __name__ == "__main__":
    debug_cleanup_verification()
