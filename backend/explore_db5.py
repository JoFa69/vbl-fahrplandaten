import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)

query1 = "SELECT COUNT(*) FROM cub_schedule cs JOIN dim_fahrt f ON cs.frt_id = f.frt_id WHERE f.fahrt_typ > 1"
print(f"Count of pull-outs/ins in schedule: {con.execute(query1).fetchone()[0]}")

print("\n--- Let's look at the first and last trips of an umlauf in cub_schedule ---")
query2 = """
WITH ranked AS (
    SELECT 
        cs.umlauf_id,
        cs.frt_start,
        cs.frt_ende,
        cs.start_stop_id,
        cs.end_stop_id,
        ROW_NUMBER() OVER (PARTITION BY cs.umlauf_id ORDER BY cs.frt_start ASC) as rn_first,
        ROW_NUMBER() OVER (PARTITION BY cs.umlauf_id ORDER BY cs.frt_start DESC) as rn_last
    FROM cub_schedule cs
)
SELECT 
    u.umlauf_kuerzel,
    o_start.stop_name as first_stop,
    o_end.stop_name as last_stop,
    r_first.frt_start as ausfahrt_zeit,
    r_last.frt_ende as einfahrt_zeit
FROM dim_umlauf u
JOIN ranked r_first ON u.umlauf_id = r_first.umlauf_id AND r_first.rn_first = 1
JOIN ranked r_last ON u.umlauf_id = r_last.umlauf_id AND r_last.rn_last = 1
LEFT JOIN dim_ort o_start ON r_first.start_stop_id = o_start.stop_id
LEFT JOIN dim_ort o_end ON r_last.end_stop_id = o_end.stop_id
LIMIT 10
"""
res = con.execute(query2).fetchall()
for r in res:
    print(r)
    
print("\n--- Check vehicle link ---")
query3 = "SELECT umlauf_id, COUNT(DISTINCT vehicle_id) FROM cub_schedule WHERE vehicle_id IS NOT NULL GROUP BY umlauf_id LIMIT 5"
res3 = con.execute(query3).fetchall()
for r in res3:
    print(r)
