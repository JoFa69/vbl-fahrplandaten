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
umlauf_times AS (
    -- For each umlauf, find its first departure (ausfahrt) and last arrival (einfahrt)
    -- This defines when the vehicle is "active"
    SELECT 
        cs.umlauf_id,
        MIN(cs.frt_start) as start_time,
        MAX(cs.frt_ende) as end_time,
        MAX(v.vehicle_type) as vehicle_type
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    GROUP BY cs.umlauf_id
),
events AS (
    SELECT vehicle_type, start_time as event_time, 1 as change FROM umlauf_times
    UNION ALL
    SELECT vehicle_type, end_time as event_time, -1 as change FROM umlauf_times
),
running_sum AS (
    SELECT vehicle_type, event_time, change,
           SUM(change) OVER (PARTITION BY vehicle_type ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as active_vehicles
    FROM events
)
SELECT vehicle_type, MAX(active_vehicles) as max_vehicles_needed
FROM running_sum
WHERE vehicle_type IS NOT NULL
GROUP BY vehicle_type
ORDER BY max_vehicles_needed DESC
"""

df_peak = con.execute(query).df()
print("Peak calculation based on MIN(start) to MAX(end) per umlauf:")
print(df_peak)

# Count distinct umlauf_id per vehicle_type
query2 = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id
    FROM cub_schedule cs
    JOIN dim_date d ON cs.day_id = d.day_id
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)
)
SELECT v.vehicle_type, COUNT(DISTINCT cs.umlauf_id) as distinct_umlaufe
FROM cub_schedule cs
JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
GROUP BY v.vehicle_type
ORDER BY distinct_umlaufe DESC
"""
df_distinct = con.execute(query2).df()
print("\nDistinct umlaufe per vehicle_type:")
print(df_distinct)

con.close()
