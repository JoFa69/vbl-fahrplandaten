import duckdb
import pandas as pd

def test_average_logic():
    con = duckdb.connect(':memory:')
    
    # Create simple dummy tables
    con.execute("""
        CREATE TABLE dim_date (
            day_id INT,
            tagesart_abbr VARCHAR
        );
        INSERT INTO dim_date VALUES 
            (1, 'Mo-Fr'), (2, 'Mo-Fr'), (3, 'Mo-Fr'), (4, 'Mo-Fr'), (5, 'Mo-Fr');
            
        CREATE TABLE dim_line (
            li_id INT,
            li_no VARCHAR
        );
        INSERT INTO dim_line VALUES 
            (1, '1'),    -- normal line
            (2, '101');  -- nightbus

        CREATE TABLE cub_schedule (
            frt_id INT,
            day_id INT,
            li_id INT,
            frt_start INT
        );
        
        -- Line 1 runs 100 times every day Mo-Fr
    """)
    
    # insert line 1 (100 trips per day Mo-Fr)
    frt_id = 1
    for day in range(1, 6):
        for i in range(100):
            con.execute(f"INSERT INTO cub_schedule VALUES ({frt_id}, {day}, 1, 36000)")
            frt_id += 1
            
    # Line 101 runs 20 times ONLY on Friday (Day 5)
    for i in range(20):
        con.execute(f"INSERT INTO cub_schedule VALUES ({frt_id}, 5, 2, 72000)")
        frt_id += 1

    print("--- 1. Testing KPI Logic for Line 1 (Normal Bus) ---")
    res1 = con.execute("""
        SELECT 
            ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as total_trips
        FROM cub_schedule s
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        WHERE l.li_no = '1' AND d.tagesart_abbr = 'Mo-Fr'
    """).df()
    print("KPI Line 1:", res1.iloc[0]['total_trips'], "Fahrten (Erwartet: 100)")

    print("\n--- 2. Testing KPI Logic for Line 101 (Night Bus) ---")
    res101 = con.execute("""
        SELECT 
            ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as total_trips
        FROM cub_schedule s
        JOIN dim_line l ON s.li_id = l.li_id
        JOIN dim_date d ON s.day_id = d.day_id
        WHERE l.li_no = '101' AND d.tagesart_abbr = 'Mo-Fr'
    """).df()
    print("KPI Line 101:", res101.iloc[0]['total_trips'], "Fahrten (Sollte das 20 oder 4 sein?)")
    
if __name__ == "__main__":
    test_average_logic()
