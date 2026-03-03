import duckdb
import os
import time

def transform_vdv_to_star():
    start_time = time.time()
    
    vdv_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
    strat_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
    out_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\operative_transformed.db"
    
    if os.path.exists(out_path):
        os.remove(out_path)
        
    print(f"Erstelle operative Datenbank: {out_path}")
    con = duckdb.connect(out_path)
    
    # Attach source databases
    con.execute(f"ATTACH '{vdv_path}' AS vdv (READ_ONLY)")
    con.execute(f"ATTACH '{strat_path}' AS strat (READ_ONLY)")
    
    # 1. Dimension Tables (Copy exact from Strat to ensure ID matching)
    print("-> Kopiere dim_line, dim_ort, dim_route...")
    con.execute("CREATE TABLE dim_line AS SELECT * FROM strat.dim_line")
    con.execute("CREATE TABLE dim_ort AS SELECT * FROM strat.dim_ort")
    con.execute("CREATE TABLE dim_route AS SELECT * FROM strat.dim_route")
    
    # 2. dim_date (Dynamic generated from VDV firmenkalender)
    print("-> Generiere dim_date...")
    con.execute("""
        CREATE TABLE dim_date AS 
        SELECT 
            CAST(BETRIEBSTAG AS BIGINT) as day_id,
            strptime(BETRIEBSTAG, '%Y%m%d') as day_date,
            CAST(TAGESART_NR AS INTEGER) as tagesart_nr,
            CASE CAST(TAGESART_NR AS INTEGER)
                WHEN 1 THEN 'Mo-Do'
                WHEN 2 THEN 'Fr'
                WHEN 3 THEN 'Sa'
                WHEN 4 THEN 'So/Ft'
                WHEN 14 THEN 'Ferien'
                ELSE 'Unbekannt'
            END as tagesart_abbr
        FROM vdv.firmenkalender
    """)
    
    # 3. cub_schedule
    # Create sequence for schedule_id
    con.execute("CREATE SEQUENCE seq_schedule START 1")
    
    print("-> Generiere cub_schedule...")
    # Map rec_frt to cub_schedule
    # Note: we use CROSS JOIN for firmenkalender where TAGESART_NR matches
    con.execute("""
        CREATE TABLE cub_schedule AS
        WITH frt_with_days AS (
            SELECT 
                nextval('seq_schedule') as schedule_id,
                l.li_id,
                CAST(cal.BETRIEBSTAG AS BIGINT) as day_id,
                CAST(f.FRT_FID AS INTEGER) as frt_id,
                CAST(f.FRT_START AS INTEGER) as frt_start,
                CAST(f.UM_UID AS INTEGER) as umlauf_id,
                f.FRT_FID as original_fid
            FROM vdv.rec_frt f
            JOIN strat.dim_line l ON l.li_no = f.LI_NR AND l.li_var_no = f.STR_LI_VAR
            JOIN vdv.firmenkalender cal ON cal.TAGESART_NR = f.TAGESART_NR
        )
        SELECT 
            schedule_id,
            li_id,
            day_id,
            frt_id,
            frt_start,
            umlauf_id,
            frt_id + day_id as unique_trip_id, -- Used internally for joining route
            original_fid
        FROM frt_with_days
    """)
    
    # 4. cub_route
    print("-> Generiere cub_route...")
    # Note: rec_frt_hzt maps to original_fid
    con.execute("""
        CREATE TABLE cub_route AS
        WITH route_base AS (
            SELECT 
                s.schedule_id,
                h.FRT_FID as original_fid,
                o.stop_id,
                CAST(h.FRT_HZT_ZEIT AS INTEGER) as ankunft,
                CAST(h.FRT_HZT_ZEIT AS INTEGER) as abfahrt,
                ROW_NUMBER() OVER (PARTITION BY s.schedule_id ORDER BY CAST(h.FRT_HZT_ZEIT AS INTEGER)) as li_lfd_nr
            FROM vdv.rec_frt_hzt h
            JOIN cub_schedule s ON s.original_fid = h.FRT_FID
            JOIN strat.dim_ort o ON CAST(h.ORT_NR AS INTEGER) = o.ort_nr
        )
        SELECT 
            schedule_id,
            CAST(li_lfd_nr AS INTEGER) as li_lfd_nr,
            stop_id,
            ankunft,
            abfahrt,
            COALESCE(LEAD(stop_id) OVER (PARTITION BY schedule_id ORDER BY li_lfd_nr), stop_id) as stop_id_nach
        FROM route_base
    """)
    
    # 5. Update Start/End Stop of cub_schedule
    print("-> Aktualisiere Start/End Haltestellen in cub_schedule...")
    con.execute("""
        ALTER TABLE cub_schedule ADD COLUMN start_stop_id INTEGER;
        ALTER TABLE cub_schedule ADD COLUMN end_stop_id INTEGER;
    """)
    con.execute("""
        UPDATE cub_schedule
        SET 
            start_stop_id = (SELECT stop_id FROM cub_route c WHERE c.schedule_id = cub_schedule.schedule_id ORDER BY li_lfd_nr ASC LIMIT 1),
            end_stop_id = (SELECT stop_id FROM cub_route c WHERE c.schedule_id = cub_schedule.schedule_id ORDER BY li_lfd_nr DESC LIMIT 1)
    """)
    
    # 6. Cleanup
    con.execute("ALTER TABLE cub_schedule DROP COLUMN original_fid")
    con.execute("ALTER TABLE cub_schedule DROP COLUMN unique_trip_id")
    
    # Verify records
    cnt_sched = con.execute("SELECT count(*) FROM cub_schedule").fetchone()[0]
    cnt_route = con.execute("SELECT count(*) FROM cub_route").fetchone()[0]
    
    print(f"\n✅ Migration erfolgreich abgeschlossen in {round(time.time() - start_time, 2)} Sekunden.")
    print(f"   -> {cnt_sched} Fahrten in cub_schedule")
    print(f"   -> {cnt_route} Haltevorgänge in cub_route")
    
    con.close()

if __name__ == "__main__":
    transform_vdv_to_star()
