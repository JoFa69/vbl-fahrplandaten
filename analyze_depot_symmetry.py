import duckdb
import pandas as pd

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

query = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id
    FROM cub_schedule cs
    JOIN dim_date d ON cs.day_id = d.day_id
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)
),
ausfahrten AS (
    SELECT DISTINCT
        cs.umlauf_id,
        CASE 
            WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Hauptdepot Weinbergli'
            ELSE o.stop_ort || ', ' || o.stop_name
        END as depot_name
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    JOIN dim_ort o ON cs.start_stop_id = o.stop_id
    WHERE f.fahrt_typ = 2
),
einfahrten AS (
    SELECT DISTINCT
        cs.umlauf_id,
        CASE 
            WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Hauptdepot Weinbergli'
            ELSE o.stop_ort || ', ' || o.stop_name
        END as depot_name
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    JOIN dim_ort o ON cs.end_stop_id = o.stop_id
    WHERE f.fahrt_typ = 3
)
SELECT 
    COALESCE(a.depot_name, e.depot_name) as depot,
    COUNT(DISTINCT a.umlauf_id) as ausfahrten_count,
    COUNT(DISTINCT e.umlauf_id) as einfahrten_count
FROM ausfahrten a
FULL OUTER JOIN einfahrten e ON a.depot_name = e.depot_name AND a.umlauf_id = e.umlauf_id
GROUP BY 1
ORDER BY 2 DESC NULLS LAST
"""

print(con.execute(query).df())
con.close()
