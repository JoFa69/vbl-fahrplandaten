
import duckdb

def analyze_relationships():
    con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)
    
    print("Checking relationship between li_id (dim_line) and route_id (cub_schedule/dim_route)...")
    
    # Check if one li_id has multiple route_ids
    query = """
        SELECT l.li_no, l.li_ri_no, l.li_var_no, count(distinct s.route_id) as route_count
        FROM cub_schedule s
        JOIN dim_line l ON s.li_id = l.li_id
        GROUP BY l.li_no, l.li_ri_no, l.li_var_no
        HAVING route_count > 1
        ORDER BY route_count DESC
        LIMIT 5
    """
    res = con.execute(query).fetchall()
    
    if res:
        print("Found lines/variants with multiple routes (Stop Sequences):")
        for r in res:
            print(r)
    else:
        print("All variants seem to have a unique route (1:1 relationship).")
        
    con.close()

if __name__ == "__main__":
    analyze_relationships()
