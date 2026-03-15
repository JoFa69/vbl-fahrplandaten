import duckdb
import os

db_path = os.path.join(os.path.dirname(__file__), "20261231_fahrplandaten_2027.db")
con = duckdb.connect(db_path, read_only=True)

# Check how many unique stop_id entries Pilatusplatz has
print("--- Pilatusplatz in dim_ort ---")
res = con.execute("""
    SELECT stop_id, stop_abbr, stop_name, stop_point_text, ideal_stop_nr
    FROM dim_ort
    WHERE stop_name = 'Pilatusplatz'
    ORDER BY stop_id
""").fetchall()
for r in res:
    print(f"  stop_id={r[0]}, stop_abbr={r[1]}, stop_name={r[2]}, stop_point_text={r[3]}, ideal_stop_nr={r[4]}")

# Check /stops style query - does it return duplicates?
print("\n--- /stops aggregate query for Pilatusplatz ---")
res2 = con.execute("""
    WITH unique_stops AS (
        SELECT
            stop_abbr,
            MAX(stop_point_text) as full_stop_name,
            MAX(stop_ort) as stop_ort,
            MAX(stop_name) as clean_stop_name,
            MAX(lat) as lat,
            MAX(lon) as lon
        FROM dim_ort
        WHERE lat IS NOT NULL AND lon IS NOT NULL
        GROUP BY stop_abbr
    )
    SELECT stop_abbr as stop_id, full_stop_name as stop_name, clean_stop_name
    FROM unique_stops
    WHERE clean_stop_name = 'Pilatusplatz'
""").fetchall()
for r in res2:
    print(f"  stop_id={r[0]}, stop_name={r[1]}, clean_stop_name={r[2]}")

# Check the bildfahrplan stops dict: what does the API return as "stops" in the trip data?
print("\n--- Bildfahrplan API trip points for PI->KTB (first trip) ---")
query = """
    WITH valid_trips AS (
        SELECT r1.schedule_id, r1.li_lfd_nr as seq_start, r2.li_lfd_nr as seq_end
        FROM cub_route r1
        JOIN dim_ort o1 ON r1.stop_id = o1.stop_id
        JOIN cub_route r2 ON r1.schedule_id = r2.schedule_id
        JOIN dim_ort o2 ON r2.stop_id = o2.stop_id
        WHERE o1.stop_abbr = 'PI' AND o2.stop_abbr = 'KTB' AND r1.li_lfd_nr < r2.li_lfd_nr
    )
    SELECT v.schedule_id, r.stop_id, o.stop_point_text, o.stop_abbr, r.li_lfd_nr
    FROM valid_trips v
    JOIN cub_route r ON r.schedule_id = v.schedule_id AND r.li_lfd_nr >= v.seq_start AND r.li_lfd_nr <= v.seq_end
    JOIN cub_schedule s ON s.schedule_id = v.schedule_id
    JOIN dim_ort o ON o.stop_id = r.stop_id
    WHERE s.day_id = 20270111
    ORDER BY v.schedule_id, r.li_lfd_nr
    LIMIT 20
"""
res3 = con.execute(query).fetchall()
for r in res3:
    print(f"  schedule_id={r[0]}, stop_id={r[1]}, text={r[2]}, abbr={r[3]}, seq={r[4]}")

con.close()
