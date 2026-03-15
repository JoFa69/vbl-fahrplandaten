import duckdb
import json
from collections import defaultdict

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

def get_variants(line_no, direction_id=1):
    # Get all distinct variants (routes) for a line and direction
    # with their stop sequences and trip counts
    query = f"""
        WITH route_trips AS (
            SELECT 
                c.route_id,
                COUNT(DISTINCT c.frt_id) as frequency
            FROM cub_schedule c
            JOIN dim_line l ON c.li_id = l.li_id
            WHERE l.li_no = '{line_no}' AND l.li_ri_no = {direction_id}
            GROUP BY c.route_id
        ),
        route_sequence AS (
            SELECT 
                r.route_id,
                list(r.ideal_stop_nr ORDER BY r.li_lfd_nr) as seq_ids,
                list(r.ideal_stop_text ORDER BY r.li_lfd_nr) as seq_names
            FROM dim_route r
            GROUP BY r.route_id
        )
        SELECT 
            rt.route_id,
            rs.seq_ids,
            rs.seq_names,
            rt.frequency
        FROM route_trips rt
        JOIN route_sequence rs ON rt.route_id = rs.route_id
        ORDER BY rt.frequency DESC
    """
    
    variants = con.execute(query).fetchall()
    
    if not variants:
        return {"nodes": [], "links": [], "matrix": [], "columns": []}
    
    # 1. Prepare data for Sankey
    links_dict = defaultdict(int)
    nodes_set = {}
    
    # Map from stop_id to stop_name
    stop_names = {}
    
    for _, seq_ids, seq_names, freq in variants:
        for i in range(len(seq_ids)):
            stop_id = seq_ids[i]
            stop_name = seq_names[i]
            if stop_id not in nodes_set:
                nodes_set[stop_id] = {"id": stop_id, "name": stop_name}
                stop_names[stop_id] = stop_name
            
            if i < len(seq_ids) - 1:
                next_id = seq_ids[i+1]
                links_dict[(stop_id, next_id)] += freq
                
    nodes = list(nodes_set.values())
    links = [{"source": src, "target": tgt, "value": val} for (src, tgt), val in links_dict.items()]
    
    # 2. Matrix Backbone Algorithm
    # We use a greedy approach based on the most frequent variant.
    # Start with highest frequency base route.
    base_route = variants[0][1]
    
    # We will build an ordered list of columns
    ordered_stops = list(base_route)
    
    # For all other variants, try to insert missing stops
    for _, seq_ids, _, _ in variants[1:]:
        for i in range(len(seq_ids)):
            stop = seq_ids[i]
            if stop not in ordered_stops:
                # Find the closest predecessor in the sequence that is in ordered_stops
                pred = None
                for j in range(i-1, -1, -1):
                    if seq_ids[j] in ordered_stops:
                        pred = seq_ids[j]
                        break
                        
                if pred:
                    pred_idx = ordered_stops.index(pred)
                    ordered_stops.insert(pred_idx + 1, stop)
                else:
                    # Find closest successor
                    succ = None
                    for j in range(i+1, len(seq_ids)):
                        if seq_ids[j] in ordered_stops:
                            succ = seq_ids[j]
                            break
                    if succ:
                        succ_idx = ordered_stops.index(succ)
                        ordered_stops.insert(succ_idx, stop)
                    else:
                        ordered_stops.append(stop)

    # Convert ordered stops to full column objects
    columns = [{"id": s, "name": stop_names[s]} for s in ordered_stops]
    
    # Matrix rows
    matrix_rows = []
    for route_id, seq_ids, seq_names, freq in variants:
        # Create a dictionary of stops in this variant
        row_stops = set(seq_ids)
        matrix_rows.append({
            "id": route_id,
            "frequency": freq,
            "stops": list(seq_ids) # keep sequence for rendering lines
        })
        
    return {
        "sankey": {"nodes": nodes, "links": links},
        "columns": columns,
        "matrix": matrix_rows
    }

print(json.dumps(get_variants('1', 1), indent=2))
