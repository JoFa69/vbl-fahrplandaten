import duckdb
con = duckdb.connect('../20261231_fahrplandaten_2027.db', read_only=True)

query = """
WITH ausfahrten AS (
    SELECT 
        cs.umlauf_id,
        cs.li_id,
        o.stop_name as depot_aus_name,
        o.stop_ort as depot_aus_ort,
        cs.frt_start as ausfahrt_zeit
    FROM cub_schedule cs
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    JOIN dim_ort o ON cs.start_stop_id = o.stop_id
    WHERE f.fahrt_typ = 2
),
einfahrten AS (
    SELECT 
        cs.umlauf_id,
        o.stop_name as depot_ein_name,
        o.stop_ort as depot_ein_ort,
        cs.frt_ende as einfahrt_zeit
    FROM cub_schedule cs
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    JOIN dim_ort o ON cs.end_stop_id = o.stop_id
    WHERE f.fahrt_typ = 3
)
SELECT 
    a.umlauf_id,
    a.li_id,
    l.line_no,
    a.depot_aus_ort || ', ' || a.depot_aus_name as depot_ausfahrt,
    e.depot_ein_ort || ', ' || e.depot_ein_name as depot_einfahrt,
    a.ausfahrt_zeit,
    e.einfahrt_zeit
FROM ausfahrten a
LEFT JOIN einfahrten e ON a.umlauf_id = e.umlauf_id
LEFT JOIN dim_line l ON a.li_id = l.li_id
LIMIT 5
"""
try:
    res = con.execute(query).fetchall()
    for r in res:
        print(r)
except Exception as e:
    print(e)
