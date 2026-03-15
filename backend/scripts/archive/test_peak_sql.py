import duckdb
con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

query = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id
    FROM cub_schedule cs
    JOIN dim_date d ON cs.day_id = d.day_id
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)
),
ausfahrten AS (
    SELECT 
        cs.umlauf_id,
        cs.frt_start as event_time,
        v.vehicle_type
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    WHERE f.fahrt_typ = 2
),
einfahrten AS (
    SELECT 
        cs.umlauf_id,
        cs.frt_ende as event_time,
        v.vehicle_type
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    WHERE f.fahrt_typ = 3
),
events AS (
    SELECT vehicle_type, event_time, 1 as change FROM ausfahrten
    UNION ALL
    SELECT vehicle_type, event_time, -1 as change FROM einfahrten
),
running_sum AS (
    SELECT vehicle_type, event_time,
           SUM(change) OVER (PARTITION BY vehicle_type ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as active_vehicles
    FROM events
)
SELECT vehicle_type, MAX(active_vehicles) as max_vehicles_needed
FROM running_sum
GROUP BY vehicle_type
"""

print(con.execute(query).df())
con.close()
