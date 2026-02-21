from fastapi import APIRouter, HTTPException, File, UploadFile
import shutil
import os
import duckdb
from collections import defaultdict
from ..database import get_db

router = APIRouter()

@router.get("/lines")
def get_lines():
    con = get_db()
    try:
        query = "SELECT DISTINCT li_no, li_text FROM dim_line ORDER BY li_no"
        result = con.execute(query).fetchall()
        return [{"line_no": row[0], "line_text": row[1]} for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lines/{line_no}/stops")
def get_line_stops(line_no: str):
    con = get_db()
    try:
        # Join cub_schedule, dim_line, dim_ort to find stops for the line
        # Use DISTINCT to avoid duplicates
        query = f"""
            SELECT DISTINCT s.stop_id, s.stop_text
            FROM cub_schedule c
            JOIN dim_line l ON c.li_id = l.li_id
            JOIN dim_ort s ON c.start_stop_id = s.stop_id
            WHERE l.li_no = '{line_no}'
            ORDER BY s.stop_text
        """
        result = con.execute(query).fetchall()
        
        if not result:
            # Check if line exists at all
            line_check = con.execute(f"SELECT COUNT(*) FROM dim_line WHERE li_no = '{line_no}'").fetchone()[0]
            if line_check == 0:
                raise HTTPException(status_code=404, detail="Line not found")
            return [] # Line exists but no stops found (unlikely for valid schedule)

        return [{"stop_id": row[0], "stop_name": row[1]} for row in result]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching stops for line {line_no}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stops")
def get_stops():
    con = get_db()
    try:
        # Get all stops with coordinates, plus real frequency and line count
        query = """
            WITH stop_trips AS (
                SELECT 
                    r.ideal_stop_nr as stop_abbr,
                    COUNT(DISTINCT s.frt_id) as total_trips,
                    COUNT(DISTINCT l.li_no) as num_lines
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                JOIN dim_line l ON s.li_id = l.li_id
                GROUP BY r.ideal_stop_nr
            ),
            unique_stops AS (
                SELECT 
                    stop_abbr, 
                    MAX(stop_point_text) as stop_name, 
                    MAX(lat) as lat, 
                    MAX(lon) as lon 
                FROM dim_ort 
                WHERE lat IS NOT NULL AND lon IS NOT NULL
                GROUP BY stop_abbr
            )
            SELECT 
                u.stop_abbr as stop_id,
                COALESCE(u.stop_name, u.stop_abbr) as stop_name,
                COALESCE(st.total_trips, 0) as frequency,
                COALESCE(st.num_lines, 0) as lines,
                u.lat,
                u.lon
            FROM unique_stops u
            LEFT JOIN stop_trips st ON u.stop_abbr = st.stop_abbr
            ORDER BY st.total_trips DESC NULLS LAST
        """
        result = con.execute(query).fetchall()
        return [
            {
                "stop_id": row[0], 
                "stop_name": row[1], 
                "frequency": row[2],
                "lines": row[3],
                "lat": row[4], 
                "lon": row[5]
            } for row in result
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables")
def get_tables():
    con = get_db()
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    return {"tables": tables}

@router.get("/table/{table_name}")
def get_table_data(table_name: str, limit: int = 100, offset: int = 0):
    con = get_db()
    
    # Sanitize table name (simple check)
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    if table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Get metadata
    columns = [x[0] for x in con.execute(f"DESCRIBE '{table_name}'").fetchall()]
    
    # Get total count
    total_count = con.execute(f"SELECT COUNT(*) FROM '{table_name}'").fetchone()[0]
    
    # Get data
    query = f"SELECT * FROM '{table_name}' LIMIT {limit} OFFSET {offset}"
    df = con.execute(query).df()
    
    # Handle NaN for JSON serialization
    data = df.fillna("").to_dict(orient="records")
    
    return {
        "columns": columns,
        "data": data,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/stats")
def get_stats():
    con = get_db()
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    stats = []
    for t in tables:
        try:
            count = con.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
            cols = [x[0] for x in con.execute(f'DESCRIBE "{t}"').fetchall()]
            stats.append({"table": t, "rows": count, "columns": len(cols)})
        except:
            pass
    return stats


# VDV 452 file descriptions
VDV_DESCRIPTIONS = {
    "basis_ver_gueltigkeit": "Gültigkeit der Basisversionen",
    "einzelanschluss": "Einzelanschlüsse zwischen Fahrten",
    "fahrzeug": "Fahrzeugstammdaten",
    "firmenkalender": "Betriebskalender / Tagesart-Zuordnung",
    "lid_verlauf": "Linienverlauf (Haltestellenfolge)",
    "menge_basis_versionen": "Basisversionen-Definitionen",
    "menge_bereich": "Betriebsbereiche",
    "menge_fahrtart": "Fahrtarten (regulär, Einrücker, etc.)",
    "menge_fgr": "Fahrgastgruppen",
    "menge_fzg_typ": "Fahrzeugtypen",
    "menge_onr_typ": "Ortsnummerntypen",
    "menge_ort_typ": "Ortstypen (Haltestelle, Depot, etc.)",
    "menge_tagesart": "Tagesarten (Mo-Fr, Sa, So, etc.)",
    "ort_hztf": "Haltezeit-Zuschläge an Orten",
    "rec_anr": "Anschlussregeln",
    "rec_frt": "Fahrten (Kernstück: Fahrt-Definitionen)",
    "rec_frt_hzt": "Fahrt-Haltezeiten (Zeiten an Haltestellen)",
    "rec_hp": "Haltepunkte (Steige / Bussteige)",
    "rec_lid": "Linien-Definitionen",
    "rec_om": "Ortsmerkmal / Ortsmerkmale",
    "rec_ort": "Ortstabelle (Haltestellen mit Koordinaten)",
    "rec_sel": "Selektionen (Tagesart-Gruppen)",
    "rec_sel_zp": "Selektions-Zeitprofile",
    "rec_ueb": "Übergangszeiten",
    "rec_umlauf": "Umlauf-Definitionen",
    "rec_ums": "Umsteigebeziehungen",
    "rec_znr": "Zeitprofilnummern",
    "sel_fzt_feld": "Fahrzeit-Felder (Zeiten zwischen Halten)",
    "ueb_fzt": "Übergangs-Fahrzeiten",
    "zul_verkehrsbetrieb": "Verkehrsbetrieb-Stammdaten",
}

@router.get("/raw-files")
def get_raw_files():
    """List all raw VDV 452 .x10 files with metadata."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
    data_dir = os.path.normpath(data_dir)
    
    files = []
    if os.path.exists(data_dir):
        for f in sorted(os.listdir(data_dir)):
            if f.endswith('.x10'):
                filepath = os.path.join(data_dir, f)
                name = f.replace('.x10', '')
                size = os.path.getsize(filepath)
                # Count lines
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='replace') as fh:
                        line_count = sum(1 for _ in fh)
                except:
                    line_count = 0
                
                files.append({
                    "filename": f,
                    "name": name,
                    "description": VDV_DESCRIPTIONS.get(name, name),
                    "size": size,
                    "lines": line_count
                })
    return files

@router.get("/raw-file/{filename}")
def get_raw_file_preview(filename: str, limit: int = 50, offset: int = 0):
    """Parse and preview a raw VDV .x10 file as a structured table."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
    data_dir = os.path.normpath(data_dir)
    filepath = os.path.join(data_dir, filename)
    
    if not os.path.exists(filepath) or not filename.endswith('.x10'):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        columns = []
        formats = []
        table_name = ""
        meta = {}
        all_records = []
        
        with open(filepath, 'r', encoding='latin-1') as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                
                # Parse VDV header lines
                if line.startswith('tbl;'):
                    table_name = line.split(';', 1)[1].strip().strip('"')
                    meta["table"] = table_name
                elif line.startswith('src;'):
                    parts = [p.strip().strip('"') for p in line.split(';')[1:]]
                    meta["source"] = parts[0] if parts else ""
                    meta["export_date"] = parts[1] if len(parts) > 1 else ""
                elif line.startswith('chs;'):
                    meta["charset"] = line.split(';', 1)[1].strip().strip('"')
                elif line.startswith('ver;'):
                    meta["version"] = line.split(';', 1)[1].strip().strip('"')
                elif line.startswith('atr;'):
                    columns = [c.strip().strip('"') for c in line.split(';')[1:]]
                    # Remove empty trailing columns
                    columns = [c for c in columns if c]
                elif line.startswith('frm;'):
                    formats = [f.strip().strip('"') for f in line.split(';')[1:]]
                    formats = [f for f in formats if f]
                elif line.startswith('rec;'):
                    # Parse data row
                    parts = line.split(';')[1:]  # skip 'rec' prefix
                    row = {}
                    for i, col in enumerate(columns):
                        if i < len(parts):
                            val = parts[i].strip().strip('"')
                            row[col] = val
                        else:
                            row[col] = ""
                    all_records.append(row)
        
        total_count = len(all_records)
        # Apply pagination
        paged = all_records[offset:offset + limit]
        
        # Build column type info
        col_info = []
        for i, col in enumerate(columns):
            fmt = formats[i] if i < len(formats) else "unknown"
            col_info.append({"name": col, "type": fmt})
        
        return {
            "filename": filename,
            "table_name": table_name,
            "meta": meta,
            "columns": columns,
            "column_info": col_info,
            "data": paged,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lines/{line_no}/variants")
def get_line_variants(line_no: str, direction_id: int = 1):
    con = get_db()
    try:
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
            unique_stops AS (
                SELECT stop_abbr, MAX(stop_point_text) as stop_name
                FROM dim_ort
                GROUP BY stop_abbr
            ),
            route_sequence AS (
                SELECT 
                    r.route_id,
                    list(r.ideal_stop_nr ORDER BY r.li_lfd_nr) as seq_ids,
                    list(COALESCE(u.stop_name, r.ideal_stop_text) ORDER BY r.li_lfd_nr) as seq_names
                FROM dim_route r
                LEFT JOIN unique_stops u ON r.ideal_stop_nr = u.stop_abbr
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
            return {"sankey": {"nodes": [], "links": []}, "columns": [], "matrix": []}
        
        # 0. Extract stop names
        stop_names = {}
        for _, seq_ids, seq_names, _ in variants:
            for i in range(len(seq_ids)):
                stop_names[seq_ids[i]] = seq_names[i]
                
        # 1. Matrix Backbone Algorithm (Topological Sort)
        base_route = variants[0][1]
        ordered_stops = list(base_route)
        
        for _, seq_ids, _, _ in variants[1:]:
            for i in range(len(seq_ids)):
                stop = seq_ids[i]
                if stop not in ordered_stops:
                    pred = None
                    for j in range(i-1, -1, -1):
                        if seq_ids[j] in ordered_stops:
                            pred = seq_ids[j]
                            break
                    if pred:
                        pred_idx = ordered_stops.index(pred)
                        ordered_stops.insert(pred_idx + 1, stop)
                    else:
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

        columns = [{"id": s, "name": stop_names.get(s, s)} for s in ordered_stops]
        
        # 2. Prepare data for Sankey
        # We use ordered_stops to strictly enforce a Direct Acyclic Graph (DAG)
        # ECharts Sankey fails when there are loops (e.g., LUBF -> LUBF) or back-edges.
        links_dict = defaultdict(int)
        nodes_set = {}
        
        for _, seq_ids, seq_names, freq in variants:
            for i in range(len(seq_ids)):
                stop_id = seq_ids[i]
                stop_name = seq_names[i]
                
                if stop_id not in nodes_set:
                    nodes_set[stop_id] = {"id": stop_id, "name": stop_name}
                
                if stop_name and stop_id not in [c["id"] for c in columns]:
                    # Update column name if it was skipped (rare)
                    for c in columns:
                        if c["id"] == stop_id: c["name"] = stop_name
                
                if i < len(seq_ids) - 1:
                    next_id = seq_ids[i+1]
                    
                    # Ensure it's a DAG by strictly flowing left-to-right according to the Backbone
                    if stop_id in ordered_stops and next_id in ordered_stops:
                        if ordered_stops.index(stop_id) < ordered_stops.index(next_id):
                            links_dict[(stop_id, next_id)] += freq
                    
        nodes = list(nodes_set.values())
        links = [{"source": src, "target": tgt, "value": val} for (src, tgt), val in links_dict.items()]
        
        matrix_rows = []
        for route_id, seq_ids, seq_names, freq in variants:
            matrix_rows.append({
                "id": route_id,
                "frequency": freq,
                "stops": list(seq_ids)
            })
            
        return {
            "sankey": {"nodes": nodes, "links": links},
            "columns": columns,
            "matrix": matrix_rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
