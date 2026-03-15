import duckdb

def analyze_vdv_to_star():
    vdv_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
    strat_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
    con = duckdb.connect(':memory:')
    con.execute(f"ATTACH '{vdv_path}' AS vdv (READ_ONLY)")
    con.execute(f"ATTACH '{strat_path}' AS strat (READ_ONLY)")
    
    print("dim_line in STRAT:")
    print(con.execute("SELECT * FROM strat.dim_line LIMIT 3").df())
    
    print("\nrec_frt in VDV:")
    print(con.execute("SELECT * FROM vdv.rec_frt LIMIT 3").df())
    
    print("\nrec_frt join dim_line check:")
    res = con.execute("""
        SELECT 
            f.FRT_FID, f.FRT_START, f.LI_NR, l.li_id, f.UM_UID as umlauf_id
        FROM vdv.rec_frt f
        LEFT JOIN strat.dim_line l ON l.li_no = f.LI_NR
        LIMIT 5
    """).df()
    print(res)

if __name__ == "__main__":
    analyze_vdv_to_star()
