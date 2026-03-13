import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

query = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id, cs.day_id 
    FROM cub_schedule cs 
    JOIN dim_date d ON cs.day_id = d.day_id 
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3) 
),
aus AS (
    SELECT 
        CASE 
            WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Weinbergli'
            WHEN o.stop_ort LIKE '%Root%' THEN 'Root'
            WHEN o.stop_ort LIKE '%Rothenburg%' OR o.stop_name LIKE '%Rothenburg%' THEN 'Rothenburg'
            ELSE o.stop_ort || ', ' || o.stop_name
        END as depot,
        COUNT(DISTINCT cs.umlauf_id || '_' || cs.day_id) as count
    FROM cub_schedule cs 
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id 
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id 
    JOIN dim_ort o ON cs.start_stop_id = o.stop_id 
    WHERE f.fahrt_typ = 2 
    GROUP BY 1
),
ein AS (
    SELECT 
        CASE 
            WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Weinbergli'
            WHEN o.stop_ort LIKE '%Root%' THEN 'Root'
            WHEN o.stop_ort LIKE '%Rothenburg%' OR o.stop_name LIKE '%Rothenburg%' THEN 'Rothenburg'
            ELSE o.stop_ort || ', ' || o.stop_name
        END as depot,
        COUNT(DISTINCT cs.umlauf_id || '_' || cs.day_id) as count
    FROM cub_schedule cs 
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id 
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id 
    JOIN dim_ort o ON cs.end_stop_id = o.stop_id 
    WHERE f.fahrt_typ = 3 
    GROUP BY 1
)
SELECT a.depot, a.count as aus_total, e.count as ein_total
FROM aus a 
FULL OUTER JOIN ein e ON a.depot = e.depot
"""

df = con.execute(query).df()
print(df)

con.close()
