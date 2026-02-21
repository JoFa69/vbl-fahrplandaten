
import duckdb

def debug_coords():
    con = duckdb.connect('vdv_schedule.duckdb', read_only=True)
    
    print("Valid 'Luzern, Bahnhof' stops in rec_ort:")
    res = con.execute("SELECT ORT_NR, ORT_NAME, ORT_REF_ORT, ORT_REF_ORT_NAME FROM rec_ort WHERE ORT_NAME LIKE '%Luzern, Bahnhof%' ORDER BY ORT_NR").fetchall()
    for r in res:
        print(r)
    con.close()
    
    print("\n------------------------------------------------")
    print("Checking usage of 'Zombie' IDs (11903, 11907, 11908, 11910) in Main DB...")
    
    con_main = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
    
    zombies = [11903, 11907, 11908, 11910]
    
    # Check dim_ort
    print("\nZombies in dim_ort:")
    res = con_main.execute(f"SELECT ort_nr, stop_text, lat, lon FROM dim_ort WHERE ort_nr IN {tuple(zombies)}").fetchall()
    for r in res:
        print(r)
        
    # Check usage in dim_route (ideal_stop_nr)
    # ideal_stop_nr is usually the JOIN key (HST_NR_NATIONAL or similar?) matches ort_nr?
    # In dim_route scheme it seems ideal_stop_nr is TEXT (like '11908' or 'LUBF'?).
    # import_vdv.py sync used: WHERE main_db.dim_ort.ort_nr = CAST(src.ORT_NR AS INTEGER)
    # so ideal_stop_nr probably matches ORT_NR.
    
    print("\nUsage in dim_route (referenced as ideal_stop_nr):")
    # ideal_stop_nr might be string
    zombies_str = [str(z) for z in zombies]
    res = con_main.execute(f"SELECT ideal_stop_nr, count(*) FROM dim_route WHERE ideal_stop_nr IN {tuple(zombies_str)} GROUP BY ideal_stop_nr").fetchall()
    for r in res:
        print(r)
        
    # Check usage in cub_schedule?
    # cub_schedule links to dim_route via route_id.
    
    con_main.close()

if __name__ == "__main__":
    debug_coords()
