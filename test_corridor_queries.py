import duckdb
import pandas as pd

def test_corridor_queries():
    con = duckdb.connect(r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db", read_only=True)
    
    stop_id = 153 # Pilatusplatz as an example
    tagesart = 'Mo-Fr'
    
    print("--- Abfahrtsminuten Matrix ---")
    q_matrix = f"""
        SELECT 
            l.li_no,
            l.li_ri_no as richtung,
            r.abfahrt,
            date_part('hour', TO_TIMESTAMP(r.abfahrt)) as std,
            date_part('minute', TO_TIMESTAMP(r.abfahrt)) as h_min
        FROM cub_route r
        JOIN cub_schedule s ON r.schedule_id = s.schedule_id
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        WHERE r.stop_id = {stop_id}
          AND d.tagesart_abbr = '{tagesart}'
        LIMIT 10
    """
    df_matrix = con.execute(q_matrix).df()
    print(df_matrix.to_string())

if __name__ == "__main__":
    test_corridor_queries()
