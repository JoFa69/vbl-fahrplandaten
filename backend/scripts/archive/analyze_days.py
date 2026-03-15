import duckdb
import pandas as pd

def analyze_days():
    db_path = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
    con = duckdb.connect(db_path, read_only=True)
    
    print("--- 1. Welche Tage werden aktuell in cub_schedule verwendet? ---")
    query_days = """
        SELECT 
            d.day_id, 
            CAST(d.day_date AS DATE) as date,
            d.tagesart_nr,
            d.tagesart_abbr,
            COUNT(s.frt_id) as trip_count
        FROM dim_date d
        JOIN cub_schedule s ON d.day_id = s.day_id
        GROUP BY 1, 2, 3, 4
        ORDER BY d.day_id
    """
    df_days = con.execute(query_days).df()
    print(df_days.to_string())
    print("\n")
    
    print("--- 2. Trip-Anzahl pro Linie und Tag (Gibt es Unterschiede?) ---")
    query_diff = """
        WITH line_day_counts AS (
            SELECT 
                l.li_no,
                CAST(d.day_date AS DATE) as date,
                d.tagesart_abbr,
                COUNT(s.frt_id) as trip_count
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            GROUP BY 1, 2, 3
        )
        SELECT * FROM line_day_counts
        ORDER BY CAST(li_no AS INTEGER), date
    """
    df_diff = con.execute(query_diff).df()
    
    # Let's find if any line has different trip counts across the days grouped under 'Mo-Fr'
    # First, get days that are 'Mo-Fr' from df_days
    mo_fr_days = df_days[df_days['tagesart_abbr'] == 'Mo-Fr']['date'].tolist()
    
    if len(mo_fr_days) > 1:
        print(f"Vergleiche Fahrtzahlen für die 'Mo-Fr' Tage: {mo_fr_days}")
        # Filter for Mo-Fr days
        df_mo_fr = df_diff[df_diff['date'].isin(mo_fr_days)]
        
        # Check standard deviation of trip_count per line
        std_devs = df_mo_fr.groupby('li_no')['trip_count'].std()
        diff_lines = std_devs[std_devs > 0].index.tolist()
        
        if diff_lines:
            print(f"Ja, es gibt Unterschiede an den verschiedenen Mo-Fr Tagen bei folgenden Linien: {diff_lines}")
            
            # Show the exact differences for the first few lines
            for li in diff_lines[:5]:
                print(f"\nLinie {li}:")
                print(df_mo_fr[df_mo_fr['li_no'] == li].to_string(index=False))
        else:
            print("Nein, alle Linien haben an jedem erfassten 'Mo-Fr' Tag exakt gleich viele Fahrten.")
    else:
        print("Es gibt nur einen oder gar keinen 'Mo-Fr' Tag in den Daten, kann nicht verglichen werden.")

    # Show a pivot table for general overview of all lines and all dates
    print("\n--- Übersicht: Anzahl Fahrten pro Linie & Datum ---")
    pivot_df = df_diff.pivot(index='li_no', columns='date', values='trip_count').fillna(0).astype(int)
    print(pivot_df.head(20).to_string())

if __name__ == "__main__":
    analyze_days()
