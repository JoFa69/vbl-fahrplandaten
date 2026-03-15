
import duckdb

def verify():
    con = duckdb.connect(':memory:')
    con.execute("CREATE TABLE t (val VARCHAR, expected DOUBLE)")
    con.execute("INSERT INTO t VALUES ('470151544', 47.0309845), ('81508770', 8.2524361)")
    
    # 3. Create Macro for parsing
    # Formula:
    # G = substr(val, 1, length - 7)
    # M = substr(val, length - 6, 2)
    # S_whole = substr(val, length - 4, 2)
    # S_frac = substr(val, length - 2, 3)
    # S = S_whole + S_frac / 1000.0
    # Res = G + M/60 + S/3600
    
    sql = """
    CREATE OR REPLACE MACRO vdv_dms_to_dd(val) AS 
    CAST(substr(val, 1, length(val) - 7) AS INTEGER) + 
    CAST(substr(val, length(val) - 6, 2) AS INTEGER) / 60.0 + 
    (CAST(substr(val, length(val) - 4, 2) AS INTEGER) + CAST(substr(val, length(val) - 2, 3) AS DOUBLE) / 1000.0) / 3600.0
    """
    con.execute(sql)
    
    res = con.execute('SELECT val, expected, vdv_dms_to_dd(val) as calculated FROM t').fetchall()
    
    print(f"{'Input':<12} | {'Expected':<12} | {'Calculated':<12} | {'Diff':<12}")
    print("-" * 55)
    for r in res:
        diff = abs(r[1]-r[2])
        print(f"{r[0]:<12} | {r[1]:<12.7f} | {r[2]:<12.7f} | {diff:.9f}")
        
    if all(abs(r[1]-r[2]) < 0.0000001 for r in res):
        print("\nSUCCESS: Verification Passed!")
    else:
        print("\nFAILURE: Verification Failed!")

if __name__ == "__main__":
    verify()
