import urllib.request, json
import duckdb

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

query = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id
    FROM cub_schedule cs
    JOIN dim_date d ON cs.day_id = d.day_id
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)
),
trips_distinct AS (
    SELECT DISTINCT
        l.li_no as line_no,
        v.vehicle_type,
        cs.umlauf_id,
        cs.frt_start as event_start,
        cs.frt_ende as event_end
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    LEFT JOIN dim_line l ON cs.li_id = l.li_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    WHERE f.fahrt_typ = 1
),
events AS (
    SELECT line_no, vehicle_type, event_start as event_time, 1 as change FROM trips_distinct
    UNION ALL
    SELECT line_no, vehicle_type, event_end as event_time, -1 as change FROM trips_distinct
),
running_sum AS (
    SELECT line_no, vehicle_type, event_time,
            SUM(change) OVER (PARTITION BY line_no, vehicle_type ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as active_vehicles
    FROM events
)
SELECT line_no, vehicle_type, MAX(active_vehicles) as max_vehicles_needed
FROM running_sum
WHERE line_no IS NOT NULL
GROUP BY line_no, vehicle_type
HAVING MAX(active_vehicles) > 0
ORDER BY CAST(REGEXP_REPLACE(line_no, '[^0-9]', '') AS INT) ASC, line_no
LIMIT 10
"""
print(con.execute(query).df())
con.close()
