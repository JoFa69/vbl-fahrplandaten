import duckdb
import pandas as pd

def analyze_vdv_days():
    db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
    con = duckdb.connect(db_path, read_only=True)
    
    print("--- 1. Firmenkalender - Zuordnung Datum zu Tagesart ---")
    query_cal = """
        SELECT 
            BETRIEBSTAG, 
            tagesart_nr 
        FROM firmenkalender 
        ORDER BY BETRIEBSTAG
    """
    df_cal = con.execute(query_cal).df()
    print(df_cal.to_string())

    print("\n--- 2. Tagesarten - Beschreibung ---")
    query_ta = "SELECT tagesart_nr, tagesart_text FROM menge_tagesart ORDER BY tagesart_nr"
    df_ta = con.execute(query_ta).df()
    print(df_ta.to_string())

    print("\n--- 3. Fahrten pro Linie und Tagesart (Gibt es Unterschiede?) ---")
    query_diff = """
        SELECT 
            LI_NR,
            TAGESART_NR,
            COUNT(*) as trip_count
        FROM rec_frt
        GROUP BY 1, 2
    """
    df_diff = con.execute(query_diff).df()
    
    pivot_df = df_diff.pivot(index='LI_NR', columns='TAGESART_NR', values='trip_count').fillna(0).astype(int)
    print("\nÜbersicht: Anzahl Fahrten pro Linie & Tagesart (Tagesart 1=Mo-Do, 2=Fr, 3=Sa, 4=So)")
    print(pivot_df.head(20).to_string())
        
if __name__ == "__main__":
    analyze_vdv_days()
