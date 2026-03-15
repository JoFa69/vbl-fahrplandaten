import duckdb
con = duckdb.connect("20261231_fahrplandaten_2027.db", read_only=True)

q = """
SELECT o.stop_abbr, COUNT(*) 
FROM cub_schedule s 
JOIN cub_route r ON s.schedule_id = r.schedule_id 
JOIN dim_ort o ON s.end_stop_id = o.stop_id 
JOIN dim_line l ON s.li_id = l.li_id 
WHERE l.li_no IN ('1', '2', '4', '11') 
  AND r.stop_id = (SELECT stop_id FROM dim_ort WHERE stop_abbr='WSTR' LIMIT 1) 
  AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr=1) 
GROUP BY o.stop_abbr 
ORDER BY 2 DESC 
LIMIT 10
"""
print("End Stops for WSTR trips (Lines 1,2,4,11):")
print(con.execute(q).fetchall())


q2 = """
SELECT o.stop_abbr, COUNT(*) 
FROM cub_schedule s 
JOIN cub_route r ON s.schedule_id = r.schedule_id 
JOIN dim_ort o ON s.start_stop_id = o.stop_id 
JOIN dim_line l ON s.li_id = l.li_id 
WHERE l.li_no IN ('1', '2', '4', '11') 
  AND r.stop_id = (SELECT stop_id FROM dim_ort WHERE stop_abbr='WSTR' LIMIT 1) 
  AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr=1) 
GROUP BY o.stop_abbr 
ORDER BY 2 DESC 
LIMIT 10
"""
print("Start Stops for WSTR trips (Lines 1,2,4,11):")
print(con.execute(q2).fetchall())
