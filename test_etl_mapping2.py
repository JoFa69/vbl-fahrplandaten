import duckdb

def check_line_mapping():
    vdv_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
    strat_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
    con = duckdb.connect(':memory:')
    con.execute(f"ATTACH '{vdv_path}' AS vdv (READ_ONLY)")
    con.execute(f"ATTACH '{strat_path}' AS strat (READ_ONLY)")
    
    res = con.execute("""
        SELECT 
            f.FRT_FID, f.FRT_START, f.LI_NR, f.STR_LI_VAR, l.li_id
        FROM vdv.rec_frt f
        LEFT JOIN strat.dim_line l ON l.li_no = f.LI_NR AND l.li_var_no = f.STR_LI_VAR
        LIMIT 10
    """).df()
    print(res)
    
if __name__ == "__main__":
    check_line_mapping()
