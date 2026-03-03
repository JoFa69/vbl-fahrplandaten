import duckdb
import pandas as pd

def check_ferienfahrplan():
    print("=== Analyse Ferienfahrplan (Tagesart 14) ===\n")

    # 1. Check Strategic DB
    db_strat = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\20261231_fahrplandaten_2027.db"
    con_strat = duckdb.connect(db_strat, read_only=True)
    
    print("--- 1. Strategische Datenbank (20261231_fahrplandaten_2027.db) ---")
    try:
        query_strat = """
            SELECT 
                l.li_no,
                COUNT(s.frt_id) as fahrten
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            WHERE d.tagesart_nr = 14
              AND l.li_no IN ('5', '6', '7', '9')
            GROUP BY 1
            ORDER BY l.li_no
        """
        df_strat = con_strat.execute(query_strat).df()
        if not df_strat.empty:
            print("Gefundene Fahrten für Tagesart 14:")
            print(df_strat.to_string(index=False))
        else:
            print("Keine Fahrten für Tagesart 14 bei den betroffenen Linien gefunden.")
            
        # check if tagesart 14 exists at all
        query_ta = "SELECT DISTINCT tagesart_nr, tagesart_abbr, tagesart_text FROM dim_date WHERE tagesart_nr = 14"
        df_ta = con_strat.execute(query_ta).df()
        if not df_ta.empty:
            print("\nTagesart 14 Definition in dim_date:")
            print(df_ta.to_string(index=False))
        else:
            print("\nTagesart 14 ist in dim_date NICHT definiert.")
            
    except Exception as e:
        print(f"Fehler bei Strategischer DB: {e}")

    print("\n--- 2. Operative Datenbank (vdv_schedule.duckdb) ---")
    db_oper = r"c:\Users\Joche\OneDrive\Desktop\VBL Fahrplandaten\vdv_schedule.duckdb"
    con_oper = duckdb.connect(db_oper, read_only=True)
    
    try:
        query_oper = """
            SELECT 
                LI_NR as li_no,
                COUNT(*) as fahrten
            FROM rec_frt
            WHERE CAST(TAGESART_NR AS INTEGER) = 14
              AND LI_NR IN ('5', '6', '7', '9')
            GROUP BY 1
            ORDER BY LI_NR
        """
        df_oper = con_oper.execute(query_oper).df()
        if not df_oper.empty:
            print("Gefundene Fahrten für Tagesart 14:")
            print(df_oper.to_string(index=False))
        else:
            print("Keine Fahrten für Tagesart 14 bei den betroffenen Linien gefunden.")
            
        # check definition
        query_ta_oper = "SELECT TAGESART_NR, TAGESART_TEXT FROM menge_tagesart WHERE CAST(TAGESART_NR AS INTEGER) = 14"
        df_ta_oper = con_oper.execute(query_ta_oper).df()
        if not df_ta_oper.empty:
            print("\nTagesart 14 Definition in menge_tagesart:")
            print(df_ta_oper.to_string(index=False))
        else:
            print("\nTagesart 14 ist in menge_tagesart NICHT definiert.")

    except Exception as e:
        print(f"Fehler bei Operativer DB: {e}")

if __name__ == "__main__":
    check_ferienfahrplan()
