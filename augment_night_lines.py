import duckdb
import os

STRAT_DB = '20261231_fahrplandaten_2027.db'
VDV_DB = 'vdv_schedule.duckdb'

def augment():
    print(f"Augmenting {STRAT_DB} with night lines from {VDV_DB}...")
    
    con = duckdb.connect(STRAT_DB)
    con.execute(f"ATTACH '{VDV_DB}' AS vdv (READ_ONLY)")
    
    # 1. Augment dim_line
    print("-> Adding missing lines to dim_line...")
    con.execute("""
        INSERT INTO dim_line (li_id, li_no, li_ri_no, li_var_no, li_abbr, li_text)
        SELECT 
            (SELECT COALESCE(MAX(li_id), 0) FROM dim_line) + ROW_NUMBER() OVER () as li_id,
            CAST(LI_NR AS VARCHAR) as li_no,
            CAST(LI_RI_NR AS INTEGER) as li_ri_no,
            CAST(STR_LI_VAR AS VARCHAR) as li_var_no,
            LI_KUERZEL as li_abbr,
            LIDNAME as li_text
        FROM vdv.rec_lid
        WHERE LI_NR IN ('101', '102', '103', '104', '106')
        AND NOT EXISTS (
            SELECT 1 FROM dim_line l 
            WHERE l.li_no = CAST(rec_lid.LI_NR AS VARCHAR) 
            AND l.li_var_no = CAST(rec_lid.STR_LI_VAR AS VARCHAR)
        )
    """)
    
    # 2. Augment dim_fahrt
    print("-> Adding missing trips to dim_fahrt...")
    con.execute("""
        INSERT INTO dim_fahrt (frt_id, fahrt_no, fahrt_typ)
        SELECT DISTINCT
            CAST(FRT_FID AS INTEGER) as frt_id,
            CAST(FRT_FID AS INTEGER) as fahrt_no,
            1 as fahrt_typ
        FROM vdv.rec_frt
        WHERE LI_NR IN ('101', '102', '103', '104', '106')
        AND NOT EXISTS (
            SELECT 1 FROM dim_fahrt f 
            WHERE f.frt_id = CAST(rec_frt.FRT_FID AS INTEGER)
        )
    """)
    
    # 3. Augment cub_schedule
    print("-> Adding night trips to cub_schedule...")
    max_sid = con.execute("SELECT COALESCE(MAX(schedule_id), 0) FROM cub_schedule").fetchone()[0]
    
    con.execute(f"""
        INSERT INTO cub_schedule (schedule_id, li_id, day_id, frt_id, frt_start, umlauf_id, fahrtart_nr)
        SELECT 
            {max_sid} + ROW_NUMBER() OVER () as schedule_id,
            l.li_id,
            CAST(cal.BETRIEBSTAG AS BIGINT) as day_id,
            CAST(f.FRT_FID AS INTEGER) as frt_id,
            CAST(f.FRT_START AS INTEGER) as frt_start,
            CAST(f.UM_UID AS INTEGER) as umlauf_id,
            1 as fahrtart_nr
        FROM vdv.rec_frt f
        JOIN dim_line l ON l.li_no = CAST(f.LI_NR AS VARCHAR) AND l.li_var_no = CAST(f.STR_LI_VAR AS VARCHAR)
        JOIN vdv.firmenkalender cal ON cal.TAGESART_NR = f.TAGESART_NR
        WHERE f.LI_NR IN ('101', '102', '103', '104', '106')
        AND NOT EXISTS (
            SELECT 1 FROM cub_schedule s 
            WHERE s.frt_id = CAST(f.FRT_FID AS INTEGER) AND s.day_id = CAST(cal.BETRIEBSTAG AS BIGINT)
        )
    """)
    
    print("-> Updating start/end stops for new trips...")
    con.execute("""
        UPDATE cub_schedule
        SET start_stop_id = (
            SELECT CAST(h.ORT_NR AS INTEGER) 
            FROM vdv.rec_frt_hzt h 
            WHERE h.FRT_FID = CAST(cub_schedule.frt_id AS VARCHAR) 
            ORDER BY CAST(h.FRT_HZT_ZEIT AS INTEGER) ASC LIMIT 1
        ),
        end_stop_id = (
            SELECT CAST(h.ORT_NR AS INTEGER) 
            FROM vdv.rec_frt_hzt h 
            WHERE h.FRT_FID = CAST(cub_schedule.frt_id AS VARCHAR) 
            ORDER BY CAST(h.FRT_HZT_ZEIT AS INTEGER) DESC LIMIT 1
        )
        WHERE start_stop_id IS NULL AND li_id IN (SELECT li_id FROM dim_line WHERE li_no IN ('101', '102', '103', '104', '106'))
    """)

    con.close()
    print("Augmentation complete.")

if __name__ == "__main__":
    augment()
