import duckdb
import pandas as pd

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
con.execute("ATTACH 'vdv_schedule.duckdb' AS vdv (READ_ONLY);")

query = """
SELECT u.umlauf_id, u.umlauf_no, u.umlauf_kuerzel, r.FZG_TYP_NR, m.FZG_TYP_TEXT, m.STR_FZG_TYP
FROM dim_umlauf u
JOIN vdv.rec_umlauf r ON CAST(u.umlauf_no AS VARCHAR) = CAST(r.UM_UID AS VARCHAR)
LEFT JOIN vdv.menge_fzg_typ m ON r.FZG_TYP_NR = m.FZG_TYP_NR
LIMIT 10
"""
try:
    print("Matching with umlauf_no:")
    print(con.execute(query).df())
except Exception as e:
    print(e)

query2 = """
SELECT u.umlauf_id, u.umlauf_kuerzel, r.UM_UID, r.FZG_TYP_NR, m.FZG_TYP_TEXT
FROM dim_umlauf u
JOIN vdv.rec_umlauf r ON u.umlauf_kuerzel = CAST(r.UM_UID AS VARCHAR)
LEFT JOIN vdv.menge_fzg_typ m ON r.FZG_TYP_NR = m.FZG_TYP_NR
LIMIT 10
"""
try:
    print("\nMatching with umlauf_kuerzel:")
    print(con.execute(query2).df())
except Exception as e2:
    print(e2)

# Check total possible mappings
query_count1 = "SELECT COUNT(*) FROM dim_umlauf u JOIN vdv.rec_umlauf r ON CAST(u.umlauf_no AS VARCHAR) = CAST(r.UM_UID AS VARCHAR)"
query_count2 = "SELECT COUNT(*) FROM dim_umlauf u JOIN vdv.rec_umlauf r ON u.umlauf_kuerzel = CAST(r.UM_UID AS VARCHAR)"
print(f"\nTotal exact matches on no: {con.execute(query_count1).fetchone()[0]}")
print(f"Total exact matches on kuerzel: {con.execute(query_count2).fetchone()[0]}")

con.close()
