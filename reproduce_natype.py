import duckdb
import pandas as pd
import math
import os

DB_PATH = '20261231_fahrplandaten_2027.db'

_ROUTE_DIST_CTE = """
    route_dist AS (
        SELECT
            r1.schedule_id,
            SUM(
                2 * 6371.0 * asin(sqrt(
                    power(sin(radians((o2.lat - o1.lat) / 2.0)), 2) +
                    cos(radians(o1.lat)) * cos(radians(o2.lat)) *
                    power(sin(radians((o2.lon - o1.lon) / 2.0)), 2)
                ))
            ) AS distanz_km
        FROM cub_route r1
        JOIN cub_route r2
          ON r1.schedule_id = r2.schedule_id
         AND r2.li_lfd_nr   = r1.li_lfd_nr + 1
        JOIN dim_ort o1 ON r1.stop_id = o1.stop_id
        JOIN dim_ort o2 ON r2.stop_id = o2.stop_id
        WHERE o1.lat IS NOT NULL AND o1.lon IS NOT NULL
          AND o2.lat IS NOT NULL AND o2.lon IS NOT NULL
        GROUP BY r1.schedule_id
    )
"""

def reproduce_list():
    con = duckdb.connect(DB_PATH, read_only=True)
    tagesart = "Alle"
    size = 1000
    offset = 0
    sort_column = "umlauf_id"
    sort_order = "ASC"
    
    # Simple where clause from umlaeufe.py
    where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
    
    paginated_query = f"""
    WITH {_ROUTE_DIST_CTE},
    umlauf_agg AS (
        SELECT
            s.umlauf_id,
            COUNT(DISTINCT s.schedule_id) as anzahl_fahrten,
            MIN(s.frt_start) as start_zeit_sekunden,
            MAX(s.frt_ende) as ende_zeit_sekunden,
            (MAX(s.frt_ende) - MIN(s.frt_start)) / 3600.0 as dauer_stunden,
            COALESCE(SUM(rd.distanz_km), 0) as distanz_km
        FROM cub_schedule s
        LEFT JOIN route_dist rd ON s.schedule_id = rd.schedule_id
        {where_clause}
        GROUP BY s.umlauf_id
    )
    SELECT * FROM umlauf_agg
    ORDER BY {sort_column} {sort_order}, umlauf_id ASC
    LIMIT {size} OFFSET {offset}
    """
    
    print("Running list query...")
    df = con.execute(paginated_query).df()
    print(f"Query done. Processing {len(df)} rows...")
    
    for i, row in df.iterrows():
        for col in ['start_zeit_sekunden', 'ende_zeit_sekunden', 'dauer_stunden', 'distanz_km']:
            try:
                val = row[col]
                # This is likely the line that fails if val is NAType
                if not pd.isna(val):
                    if not math.isnan(val):
                        res = float(val)
                else:
                    print(f"Row {i} col {col} is NA: {type(val)}")
            except Exception as e:
                print(f"Error at row {i} col {col}: {type(val)} - {val}")
                print(f"Exception: {e}")
                return

def reproduce_gantt():
    con = duckdb.connect(DB_PATH, read_only=True)
    limit = 50
    where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
    
    top_query = f"""
        SELECT s.umlauf_id
        FROM cub_schedule s
        {where_clause}
        GROUP BY s.umlauf_id
        ORDER BY COUNT(*) DESC
        LIMIT {limit}
    """
    top_df = con.execute(top_query).df()
    if top_df.empty:
        print("No umlaeufe found")
        return

    umlauf_ids = ",".join(str(uid) for uid in top_df['umlauf_id'].tolist())

    query = f"""
        SELECT
            s.umlauf_id,
            s.schedule_id,
            s.frt_start as start_zeit_sekunden,
            s.frt_ende as ende_zeit_sekunden
        FROM cub_schedule s
        {where_clause} AND s.umlauf_id IN ({umlauf_ids})
        ORDER BY s.umlauf_id, s.frt_start
    """
    df = con.execute(query).df()
    print(f"Gantt query done. {len(df)} rows.")

    for i, row in df.iterrows():
        for col in ['start_zeit_sekunden', 'ende_zeit_sekunden']:
            try:
                val = row[col]
                if not pd.isna(val):
                    if not math.isnan(val):
                        res = int(val)
            except Exception as e:
                print(f"Gantt Error at row {i} col {col}: {type(val)} - {val}")
                print(f"Exception: {e}")
                return

if __name__ == "__main__":
    print("--- Testing List ---")
    reproduce_list()
    print("\n--- Testing Gantt ---")
    reproduce_gantt()
