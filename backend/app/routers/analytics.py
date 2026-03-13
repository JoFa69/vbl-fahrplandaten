from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from ..database import get_db
import os






router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/stats")
def get_general_stats(reference_id: Optional[str] = Query(None, description="Fahrplan Reference ID for comparison"), x_scenario: str = Header("strategic")):
    con = get_db(x_scenario)
    try:
        # Current (2026) values
        lines = con.execute("SELECT COUNT(DISTINCT li_no) FROM dim_line").fetchone()[0]
        stops = con.execute("SELECT COUNT(DISTINCT stop_no) FROM dim_ort").fetchone()[0]
        trips = con.execute("SELECT COUNT(*) FROM cub_schedule").fetchone()[0]
        
        response = {
            "total_lines": {"value": lines, "change": None},
            "total_stops": {"value": stops, "change": None},
            "total_planned_trips": {"value": trips, "change": None}
        }

        # Comparison Logic
        if reference_id:
            # TODO: Implement actual lookup when multiple datasets exist.
            # For now, if reference_id is provided but we only have one dataset, we return None for change.
            # If we had a previous year table (e.g. dim_line_2025), we would query it here.
            pass
            
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stops-by-line")
def get_stops_by_line(x_scenario: str = Header("strategic")):
    con = get_db(x_scenario)
    # ... (rest of function remains unchanged, not selecting extensive block to avoid token usage)
    try:
        # Simplified query: Count distinct stops per line
        # This joins cub_schedule with dim_line to get line numbers
        query = """
            SELECT 
                l.li_no, 
                COUNT(DISTINCT s.start_stop_id) as stop_count
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            GROUP BY l.li_no
            ORDER BY stop_count DESC
            LIMIT 10
        """
        # Execute Query
        result = con.execute(query).fetchall()
        return [{"line": row[0], "count": row[1]} for row in result]
    except Exception as e:
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trips-per-hour")
def get_trips_per_hour(x_scenario: str = Header("strategic")):
    # ... (unchanged)
    con = get_db(x_scenario)
    try:
        query = """
            SELECT 
                CAST(frt_start / 3600 AS INTEGER) as hour, 
                COUNT(*) as trip_count
            FROM cub_schedule
            GROUP BY hour
            ORDER BY hour
        """
        result = con.execute(query).fetchall()
        return [{"hour": int(row[0]), "count": row[1]} for row in result]
    except Exception as e:
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/volume")
async def get_volume_metrics(
    line_no: Optional[str] = Query(None, description="Filter by Line Number (li_no)"),
    group_by: str = Query("line", enum=["line", "hour", "direction"], description="Grouping dimension"),
    x_scenario: str = Header("strategic")
):
    # ... (unchanged logic for volume metrics charts)
    con = get_db(x_scenario)
    try:
        where_clause = ""
        params = []
        
        if line_no is not None:
            where_clause = "WHERE l.li_no = ?"
            params.append(line_no)
            
        if group_by == "line":
             query = f"""
                SELECT 
                    l.li_no as label, 
                    MAX(l.li_text) as name, 
                    ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as value
                FROM cub_schedule s
                JOIN dim_line l ON s.li_id = l.li_id
                {where_clause}
                GROUP BY l.li_no
                ORDER BY value DESC
            """
        elif group_by == "hour":
            query = f"""
                SELECT 
                    CAST(s.frt_start / 3600 AS INTEGER) as label, 
                    ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as value
                FROM cub_schedule s
                JOIN dim_line l ON s.li_id = l.li_id
                {where_clause}
                GROUP BY 1
                ORDER BY 1
            """
        elif group_by == "direction":
            query = f"""
                SELECT 
                    l.li_ri_no as label, 
                    ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as value
                FROM cub_schedule s
                JOIN dim_line l ON s.li_id = l.li_id
                {where_clause}
                GROUP BY l.li_ri_no
                ORDER BY value DESC
            """
        else:
             raise HTTPException(status_code=400, detail="Invalid group_by parameter")

        result = con.execute(query, params).fetchall()
        
        data = []
        for row in result:
             item = {"label": str(row[0]), "value": row[1]}
             if group_by == "line":
                item = {"label": str(row[0]), "name": row[1], "value": row[2], "id": str(row[0])}
             else:
                item = {"label": str(row[0]), "value": row[1]}
             data.append(item)
        return data

    except Exception as e:
        print(f"Volume Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/geometry")
async def get_geometry_metrics(
    type: str = Query("lines", enum=["lines", "variants", "stops"], description="Type of geometry data"),
    line_id: Optional[int] = Query(None, description="Line ID for variants (deprecated, use line_no)"),
    line_no: Optional[str] = Query(None, description="Line number string for filtering variants"),
    variant_id: Optional[int] = Query(None, description="Route ID for stops"),
    fahrtart: Optional[int] = Query(None, description="Trip type filter (1=Normal, 2=Einsetz, 3=Aussetz)"),
    x_scenario: str = Header("strategic")
):
    """
    Get network geometry metrics.
    - type="lines": List of all lines.
    - type="variants": List of variants for a specific line_id with extended info.
    - type="stops": List of stops for a specific variant_id (route_id).
    """
    con = get_db(x_scenario)
    try:
        if type == "lines":
            # List all unique lines grouped by li_no (not li_id, which is per-variant)
            params = []
            where_clause = ""
            if fahrtart:
                where_clause = "AND s.fahrtart_nr = ?"
                params.append(fahrtart)
                
            query = f"""
                SELECT 
                    l.li_no, 
                    MAX(l.li_text) as li_text, 
                    COUNT(DISTINCT s.route_id) as variant_count,
                    COUNT(DISTINCT s.frt_id) as trip_count
                FROM dim_line l
                LEFT JOIN cub_schedule s ON l.li_id = s.li_id {where_clause}
                GROUP BY l.li_no
                ORDER BY CAST(l.li_no AS INTEGER) ASC
            """
            result = con.execute(query, params).fetchall()
            return [
                {"id": row[0], "line_no": row[0], "name": row[1], "variants": row[2], "trips": row[3]}
                for row in result
            ]

        elif type == "variants":
            # Extended variant info
            # Support filtering by line_no (string) or line_id (int)

            volume_params = []
            main_params = []
            if line_no:
                # Filter by line number string (preferred)
                volume_where = "WHERE li_id IN (SELECT li_id FROM dim_line WHERE li_no = ?)"
                main_where = "WHERE l.li_no = ?"
                volume_params.append(line_no)
                main_params.append(line_no)
            elif line_id:
                volume_where = "WHERE li_id = ?"
                main_where = "WHERE cs.li_id = ?"
                volume_params.append(line_id)
                main_params.append(line_id)

            if fahrtart:
                volume_connector = "AND" if volume_where else "WHERE"
                volume_where += f" {volume_connector} fahrtart_nr = ?"
                volume_params.append(fahrtart)
                
                main_connector = "AND" if main_where else "WHERE"
                main_where += f" {main_connector} cs.fahrtart_nr = ?"
                main_params.append(fahrtart)

            query = f"""
                WITH route_stops AS (
                    SELECT 
                        route_id,
                        MIN(li_lfd_nr) as min_seq,
                        MAX(li_lfd_nr) as max_seq
                    FROM dim_route
                    GROUP BY route_id
                ),
                start_stop AS (
                    SELECT 
                        r.route_id, 
                        MAX(o.stop_point_text) as name
                    FROM dim_route r 
                    JOIN route_stops rs ON r.route_id = rs.route_id
                    LEFT JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
                    WHERE r.li_lfd_nr = rs.min_seq
                    GROUP BY r.route_id
                ),
                end_stop AS (
                    SELECT 
                        r.route_id, 
                        MAX(o.stop_point_text) as name
                    FROM dim_route r 
                    JOIN route_stops rs ON r.route_id = rs.route_id
                    LEFT JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
                    WHERE r.li_lfd_nr = rs.max_seq
                    GROUP BY r.route_id
                ),
                route_volume AS (
                    SELECT route_id, COUNT(*) as volume
                    FROM cub_schedule
                    {volume_where}
                    GROUP BY route_id
                )
                SELECT DISTINCT 
                    r.route_id, 
                    r.route_hash,
                    l.li_no,
                    l.li_var_no,
                    l.li_ri_no,
                    COALESCE(s.name, '?') || ' - ' || COALESCE(e.name, '?') as route_info,
                    (SELECT count(*) FROM dim_route WHERE route_id = r.route_id) as stop_count,
                    COALESCE(v.volume, 0) as volume,
                    l.li_id
                FROM dim_route r
                JOIN cub_schedule cs ON r.route_id = cs.route_id
                JOIN dim_line l ON cs.li_id = l.li_id
                LEFT JOIN start_stop s ON r.route_id = s.route_id
                LEFT JOIN end_stop e ON r.route_id = e.route_id
                LEFT JOIN route_volume v ON r.route_id = v.route_id
                {main_where}
                ORDER BY CAST(l.li_no as INTEGER), l.li_var_no
            """
            result = con.execute(query, volume_params + main_params).fetchall()
            
            return [
                {
                    "id": row[0], 
                    "hash": row[1],
                    "line_no": row[2],
                    "variant_no": row[3],
                    "direction": row[4],
                    "route_info": row[5],
                    "stop_count": row[6],
                    "volume": row[7],
                    "line_id": row[8]
                }
                for row in result
            ]

        elif type == "stops":
            if not variant_id:
                raise HTTPException(status_code=400, detail="variant_id (route_id) is required for stops")
                
            # List stops for a route
            # List stops for a route
            query = """
                WITH unique_stops AS (
                    SELECT 
                        stop_abbr, 
                        MAX(lat) as lat, 
                        MAX(lon) as lon,
                        MAX(stop_point_text) as clean_name
                    FROM dim_ort
                    GROUP BY stop_abbr
                )
                SELECT 
                    r.ideal_stop_nr, 
                    COALESCE(s.clean_name, r.ideal_stop_text) as name, 
                    s.lat, 
                    s.lon,
                    r.li_lfd_nr as seq
                FROM dim_route r
                LEFT JOIN unique_stops s ON r.ideal_stop_nr = s.stop_abbr
                WHERE r.route_id = ?
                ORDER BY r.li_lfd_nr
            """
            result = con.execute(query, [variant_id]).fetchall()
            return [
                {
                    "stop_nr": row[0], 
                    "name": row[1], 
                    "lat": row[2] if row[2] else 0.0, 
                    "lon": row[3] if row[3] else 0.0, 
                    "seq": row[4]
                }
                for row in result
            ]
            
    except Exception as e:
        print(f"Geometry Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/time")
async def get_time_metrics(
    line_id: Optional[int] = Query(None, description="Filter by Line ID"),
    variant_id: Optional[int] = Query(None, description="Filter by Variant/Route ID"),
    metric: str = Query("duration", enum=["duration", "speed"], description="Metric type"),
    x_scenario: str = Header("strategic")
):
    """
    Get time-based metrics.
    - metric="duration": Average trip duration (minutes).
      - Default: Avg duration per Line.
      - line_id: Avg duration per Variant (Route).
      - variant_id: Avg duration per Hour of day (Profil-Varianz).
    """
    con = get_db(x_scenario)
    try:
        where_clause = ""
        params = []
        
        if variant_id:
            where_clause = "WHERE s.route_id = ?"
            params.append(variant_id)
        elif line_id:
            where_clause = "WHERE s.li_id = ?"
            params.append(line_id)

        if metric == "duration":
            if variant_id:
                # Drill down: Duration per Hour for a specific variant
                query = f"""
                    SELECT 
                        CAST(s.frt_start / 3600 AS INTEGER) as label,
                        AVG((s.frt_ende - s.frt_start) / 60.0) as value
                    FROM cub_schedule s
                    {where_clause}
                    GROUP BY 1
                    ORDER BY 1
                """
            elif line_id:
                # Drill down: Duration per Variant for a specific line
                query = f"""
                    SELECT 
                        r.route_hash as label,
                        AVG((s.frt_ende - s.frt_start) / 60.0) as value,
                        s.route_id as id
                    FROM cub_schedule s
                    JOIN dim_route r ON s.route_id = r.route_id
                    {where_clause}
                    GROUP BY r.route_hash, s.route_id
                    ORDER BY value DESC
                """
            else:
                 # High level: Avg Duration per Line
                query = """
                    SELECT 
                        l.li_no as label,
                        AVG((s.frt_ende - s.frt_start) / 60.0) as value,
                        l.li_id as id
                    FROM cub_schedule s
                    JOIN dim_line l ON s.li_id = l.li_id
                    GROUP BY l.li_no, l.li_id
                    ORDER BY value DESC
                """
                
            result = con.execute(query, params).fetchall()
            
            data = []
            for row in result:
                item = {"label": str(row[0]), "value": round(row[1], 1)}
                if len(row) > 2:
                    item["id"] = row[2]
                data.append(item)
            return data

        else:
             raise HTTPException(status_code=501, detail="Speed metric not yet implemented")

    except Exception as e:
        print(f"Time Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/infrastructure")
def get_infrastructure_metrics(
    stop_id: Optional[str] = Query(None, description="Filter by Stop ID (ideal_stop_nr)"),
    limit: int = 10,
    x_scenario: str = Header("strategic")
):
    """
    Get infrastructure metrics (Stop Load).
    - Default: Top busiest stops.
    - stop_id: Load profile (events per hour) for a specific stop.
    """
    con = get_db(x_scenario)
    try:
        if stop_id:
            # Drill down: Load over time for one stop
            # Note: We match on dim_route.ideal_stop_nr
            query = """
                SELECT 
                    CAST(s.frt_start / 3600 AS INTEGER) as label,
                    COUNT(*) as value
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                WHERE r.ideal_stop_nr = ?
                GROUP BY 1
                ORDER BY 1
            """
            result = con.execute(query, [stop_id]).fetchall()
            return [{"label": str(row[0]), "value": row[1]} for row in result]
            
        else:
            # Top stops
            # We filter out technical stops (stops named 'Hinfahrt', 'Rückfahrt' etc if possible)
            # Based on inspection, 'Hinfahrt' had huge counts.
            # We try to join dim_ort to get clean names, but ideal_stop_nr didn't assume int.
            # We use ideal_stop_nr match.
            query = """
                SELECT 
                    o.stop_point_text as label,
                    COUNT(*) as value,
                    r.ideal_stop_nr as id
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
                WHERE o.stop_text NOT IN ('Hinfahrt', 'Rückfahrt', 'Endstation')
                GROUP BY o.stop_point_text, r.ideal_stop_nr
                ORDER BY value DESC
                LIMIT ?
            """
            result = con.execute(query, [limit]).fetchall()
            return [{"label": row[0], "value": row[1], "id": row[2]} for row in result]

    except Exception as e:
        print(f"Infrastructure Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/geometry/route/{line_no}")
async def get_route_geometry(line_no: str, route_id: Optional[int] = Query(None), x_scenario: str = Header("strategic")):
    """
    Get route geometry for a specific line.
    If route_id is provided, returns geometry for that specific variant as a list with one item.
    Otherwise, returns all variants for the line with their respective volume and coordinates.
    """
    con = get_db(x_scenario)
    try:
        route_info = []
        if route_id:
            route_info.append({"route_id": route_id, "volume": 1})
        else:
            # Find all routes for this line and their trip volume
            route_query = """
                SELECT r.route_id, COUNT(DISTINCT s.frt_id) as volume
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                JOIN dim_line l ON s.li_id = l.li_id
                WHERE l.li_no = ?
                GROUP BY r.route_id
                ORDER BY volume DESC
            """
            routes_data = con.execute(route_query, [line_no]).fetchall()
            
            if not routes_data:
                 raise HTTPException(status_code=404, detail="No routes found for this line")
                 
            for row in routes_data:
                route_info.append({"route_id": row[0], "volume": row[1]})
        
        # Build coordinates for each route
        results = []
        for info in route_info:
            r_id = info["route_id"]
            query = """
                SELECT 
                    r.li_lfd_nr as seq,
                    r.ideal_stop_nr as stop_id,
                    MAX(o.stop_text) as name,
                    MAX(o.stop_point_text) as stop_point_text,
                    MAX(o.stop_point_no) as stop_point_no,
                    MAX(o.lat) as lat,
                    MAX(o.lon) as lon
                FROM dim_route r
                JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
                WHERE r.route_id = ?
                GROUP BY r.li_lfd_nr, r.ideal_stop_nr
                ORDER BY r.li_lfd_nr
            """
            
            stops_data = con.execute(query, [r_id]).fetchall()
            
            stops = [
                {
                    "seq": row[0],
                    "id": row[1],
                    "name": row[2],
                    "stop_point_text": row[3],
                    "stop_point_no": row[4],
                    "lat": row[5] if row[5] else 0.0,
                    "lon": row[6] if row[6] else 0.0,
                    "is_corrected": True 
                }
                for row in stops_data
            ]
            
            results.append({
                "line_no": line_no,
                "route_id": r_id,
                "volume": info["volume"],
                "stops": stops
            })
            
        return results

    except Exception as e:
        print(f"Route Geometry Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/geometry/routes/primary")
async def get_all_primary_routes(
    fahrtart: Optional[int] = Query(None, description="Trip type filter"),
    x_scenario: str = Header("strategic")
):
    """
    Get the primary route geometry for all lines (e.g., Variant 1, Direction 1).
    Used for the initial map overview.
    """
    con = get_db(x_scenario)
    try:
        # Strategy: Valid variants only (direction 1 or 2), pick the one with most stops per line
        
        params = []
        where_clause = ""
        if fahrtart:
            where_clause = "WHERE fahrtart_nr = ?"
            params.append(fahrtart)

        query = f"""
            WITH route_stops AS (
                -- 1. Count stops per route (Small)
                SELECT route_id, COUNT(*) as cnt 
                FROM dim_route 
                GROUP BY route_id
            ),
            line_routes AS (
                -- 2. Link Line to Route (Distinct to avoid trip multiplexing)
                SELECT DISTINCT li_id, route_id 
                FROM cub_schedule
                {where_clause}
            ),
            ranked_routes AS (
                -- 3. Rank routes per line by stop count
                SELECT 
                    lr.li_id,
                    lr.route_id,
                    rs.cnt,
                    ROW_NUMBER() OVER (PARTITION BY lr.li_id ORDER BY rs.cnt DESC) as rn
                FROM line_routes lr
                JOIN route_stops rs ON lr.route_id = rs.route_id
            ),
            primary_routes AS (
                SELECT li_id, route_id 
                FROM ranked_routes 
                WHERE rn = 1
            )
            SELECT 
                pr.li_id,
                l.li_no,
                l.li_text,
                pr.route_id,
                r.li_lfd_nr as seq,
                o.lat,
                o.lon
            FROM primary_routes pr
            JOIN dim_line l ON pr.li_id = l.li_id
            JOIN dim_route r ON pr.route_id = r.route_id
            JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
            WHERE o.lat IS NOT NULL AND o.lon IS NOT NULL
            ORDER BY l.li_no, r.li_lfd_nr
        """
        
        # Determine efficient fetching. 
        # Returning ~30 lines * ~20 stops = ~600 rows. JSON overhead is fine.
        result = con.execute(query, params).fetchall()
        
        # Structure: Group by Line
        lines = {}
        for row in result:
            li_id = row[0]
            if li_id not in lines:
                lines[li_id] = {
                    "line_id": li_id,
                    "line_no": row[1],
                    "name": row[2],
                    "route_id": row[3],
                    "stops": []
                }
            
            lines[li_id]["stops"].append([row[5], row[6]]) # [lat, lon]
            
        return list(lines.values())

    except Exception as e:
        print(f"Primary Routes Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timetable/tagesarten")
def get_timetable_tagesarten(x_scenario: str = Header("strategic")):
    con = get_db(x_scenario)
    try:
        # Try with tagesart_text first (strategic DB), fall back to abbr-only (operative DB)
        try:
            query = """
                SELECT DISTINCT d.tagesart_abbr, MAX(d.tagesart_text) as tagesart_text
                FROM dim_date d
                JOIN cub_schedule s ON d.day_id = s.day_id
                WHERE d.tagesart_abbr IS NOT NULL
                GROUP BY d.tagesart_abbr
                ORDER BY MIN(d.tagesart_nr)
            """
            result = con.execute(query).fetchall()
            return [{"abbr": row[0], "text": row[1]} for row in result]
        except Exception:
            # Operative DB may not have tagesart_text column
            query_fallback = """
                SELECT DISTINCT d.tagesart_abbr, d.tagesart_abbr as tagesart_text
                FROM dim_date d
                JOIN cub_schedule s ON d.day_id = s.day_id
                WHERE d.tagesart_abbr IS NOT NULL
                GROUP BY d.tagesart_abbr
                ORDER BY MIN(d.tagesart_nr)
            """
            result = con.execute(query_fallback).fetchall()
            return [{"abbr": row[0], "text": row[1]} for row in result]
    except Exception as e:
        print(f"Tagesarten Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timetable/heatmap")
def get_timetable_heatmap(
    line_no: str = Query(..., description="Filter by Line Number (li_no)"),
    tagesart: Optional[str] = Query(None, description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    richtung: Optional[int] = Query(None, description="Richtung (1 oder 2)"),
    x_scenario: str = Header("strategic")
):
    con = get_db(x_scenario)
    try:
        where_clause = "WHERE l.li_no = ?"
        params = [line_no]

        if tagesart and tagesart != "Alle":
            where_clause += " AND d.tagesart_abbr = ?"
            params.append(tagesart)
        if richtung:
            where_clause += " AND l.li_ri_no = ?"
            params.append(richtung)

        query = f"""
            SELECT 
                CAST(s.frt_start / 3600 AS INTEGER) as hour,
                d.tagesart_abbr as tagesart,
                l.li_ri_no as direction,
                ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as trip_count
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY 1, 2, 3
            ORDER BY 1
        """
        result = con.execute(query, params).fetchall()
        return [
            {"hour": row[0], "tagesart": row[1], "direction": row[2], "trip_count": row[3]}
            for row in result
        ]
    except Exception as e:
        print(f"Heatmap Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timetable/headway")
def get_timetable_headway(
    line_no: str = Query(..., description="Filter by Line Number (li_no)"),
    tagesart: Optional[str] = Query(None, description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    richtung: Optional[int] = Query(None, description="Richtung (1 oder 2)"),
    x_scenario: str = Header("strategic")
):
    con = get_db(x_scenario)
    try:
        where_clause = "WHERE l.li_no = ?"
        params = [line_no]

        if tagesart and tagesart != "Alle":
            where_clause += " AND d.tagesart_abbr = ?"
            params.append(tagesart)
        if richtung:
            where_clause += " AND l.li_ri_no = ?"
            params.append(richtung)

        query = f"""
            WITH ordered_trips AS (
                SELECT 
                    s.frt_id,
                    s.frt_start,
                    LAG(s.frt_start) OVER (PARTITION BY l.li_ri_no, d.tagesart_abbr ORDER BY s.frt_start) as prev_start
                FROM cub_schedule s
                JOIN dim_line l ON s.li_id = l.li_id
                JOIN dim_date d ON s.day_id = d.day_id
                {where_clause}
            ),
            headways AS (
                SELECT 
                    ROUND((frt_start - prev_start) / 60.0) as headway_min
                FROM ordered_trips
                WHERE prev_start IS NOT NULL
            )
            SELECT CAST(headway_min AS INTEGER) as headway, COUNT(*) as count
            FROM headways
            GROUP BY headway_min
            ORDER BY count DESC
        """
        result = con.execute(query, params).fetchall()
        data = []
        for row in result:
             # Ignore extreme gaps (e.g. overnight gaps) which shouldn't count towards regular headway
             if row[0] >= 0 and row[0] <= 120:
                 data.append({"headway": row[0], "count": row[1]})
        
        # Sort data by length of headway naturally
        data.sort(key=lambda x: x["headway"])
        return data
    except Exception as e:
        print(f"Headway Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timetable/kpis")
def get_timetable_kpis(
    line_no: str = Query(..., description="Filter by Line Number (li_no)"),
    tagesart: Optional[str] = Query(None, description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    x_scenario: str = Header("strategic")
):
    con = get_db(x_scenario)
    try:
        where_clause = "WHERE l.li_no = ?"
        params = [line_no]

        if tagesart and tagesart != "Alle":
            where_clause += " AND d.tagesart_abbr = ?"
            params.append(tagesart)

        # 1. Base KPIs: First/Last trip, total trips
        query_base = f"""
            SELECT 
                MIN(s.frt_start) as first_trip_sec,
                MAX(s.frt_start) as last_trip_sec,
                ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as total_trips
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
        """
        res_base = con.execute(query_base, params).fetchone()
        
        # 2. Symmetry (Trips per direction)
        query_sym = f"""
            SELECT 
                l.li_ri_no, 
                ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as count
            FROM cub_schedule s
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY 1
        """
        res_sym = con.execute(query_sym, params).fetchall()
        symmetry = {f"Dir {row[0]}": int(row[1]) if row[1] else 0 for row in res_sym}

        # 3. Route variants split
        query_routes = f"""
            SELECT 
                r.route_hash,
                l.li_ri_no,
                ROUND(COUNT(DISTINCT s.frt_id) * 1.0 / NULLIF(COUNT(DISTINCT s.day_id), 0)) as trip_count
            FROM cub_schedule s
            JOIN dim_route r ON s.route_id = r.route_id
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY 1, 2
            ORDER BY trip_count DESC
            LIMIT 10
        """
        res_routes = con.execute(query_routes, params).fetchall()
        routes = [{"route_hash": row[0], "direction": row[1], "count": row[2]} for row in res_routes]

        return {
            "first_trip_sec": res_base[0] if res_base[0] else None,
            "last_trip_sec": res_base[1] if res_base[1] else None,
            "total_trips": res_base[2],
            "symmetry": symmetry,
            "routes": routes
        }
    except Exception as e:
        print(f"KPIs Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))









@router.get("/network-nodes")
def get_network_nodes(
    tagesart: Optional[str] = Query("Mo-Fr", description="Tagesart Filter (z.B. Mo-Fr, Sa, So/Ft)"),
    time_from: Optional[int] = Query(21600, description="Start time in seconds since midnight (default 06:00)"),
    time_to: Optional[int] = Query(32400, description="End time in seconds since midnight (default 09:00)"),
    richtung: Optional[int] = Query(None, description="Richtung (1 oder 2)"),
    x_scenario: str = Header("strategic")
):
    """
    Returns relevant nodes (terminals, hubs >= 2 lines, and whitelist) and abstract edges
    between these nodes for a targeted time window and day type.
    """
    con = get_db(x_scenario)
    try:
        # Define Whitelist based on Excel extraction
        white_list = [
            "493 Tellbus", "Adligenswil Dorf", "Allmend/Messe", "Arth-Goldau",
            "Bahnhof Malters", "Bern", "Biregghof", "Bramberg", "Buchrain",
            "Buchrain Dorf", "Bundesplatz", "Bösch", "Bösfeld", "Büttenhalde",
            "Château Gütsch", "Chörbli", "Dattenberg", "Ebikon Bahnhof", "Eggen",
            "Eichhof", "Eigenthal Talboden", "Emmenbrücke", "Emmenbrücke Bahnhof Süd",
            "Ennethorw", "Erlenmatte", "Fichtenstrasse", "Flugzeugwerke", "Friedental",
            "Frohburg", "Gasshof", "Gersag", "Gisikon-Root Bahnhof", "Grosshofstrasse",
            "Götzentalstrasse", "Gütsch", "Hirtenhofstrasse", "Hofmatt-Bellpark",
            "Horw Bahnhof", "Horw Zentrum", "Hubelmatt", "Hünenberg Rothus",
            "Industriestrasse", "Kantonalbank", "Kantonsspital", "Kapf",
            "Kapuzinerweg", "Kasernenplatz", "Kastanienbaum Schiffstation",
            "Kehrsiten-Bürgenstock", "Klösterli", "Kreuz", "Kreuzstutz",
            "Kriens Busschleife", "Lerchenbühl", "Linie 1 Ri Fildern",
            "Linie 26 Ri Brüelstrasse", "Linie 26 Ri Ottigenbühl", "Littau, Bahnhof",
            "Luzern Bahnhof", "Luzernerhof/Wey", "Löwen", "Maihof", "Mattenhof",
            "Matthof", "Meggen", "Obere Weinhalde", "Oberfeld", "Obergütsch",
            "Obernau Dorf", "Olten/Bern", "Perlen Fabrik", "Pilatusbahnen",
            "Pilatusmarkt", "Pilatusplatz", "Piuskirche", "Riffig", "Root D4",
            "Root Dorf", "Rotkreuz Bahnhof", "Rüeggisingen", "Schiffstation",
            "Schlossberg", "Schlössli", "Schlösslihalde", "Schönbühl",
            "Schützenhaus", "Sidhalde", "Sonnenberg", "Sonnenbergbahn",
            "Sonnenplatz", "Spier", "Spitz", "Sprengi", "St. Karli", "St. Wendelin",
            "Staffeln Schulhaus", "Stampfeli", "Stans/Sarnen", "Steinibach",
            "Sternen", "Sternmatt", "Technikumstrasse", "Tschädigen",
            "Udligenswil alte Post", "Unterlöchli", "Verkehrshaus",
            "Verkehrshaus-Lido", "Waldibrücke", "Waldstrasse", "Wartegg",
            "Weggis", "Wegscheide", "Weichlen", "Weitblick", "Würzenbach",
            "Zentralschulhaus", "Zentrum", "Zentrum Pilatus", "Zumhof",
            "Zürich", "von Gottlieben", "Hinfahrt nach Gottlieben"
        ]
        
        # Build whitelist values string
        wl_values = ", ".join([f"('{w.replace(chr(39), chr(39)*2)}')" for w in white_list])
        
        con.execute("DROP VIEW IF EXISTS active_trips_v")
        con.execute("DROP VIEW IF EXISTS whitelist_v")
        con.execute("DROP VIEW IF EXISTS route_stops_v")
        con.execute("DROP VIEW IF EXISTS trip_sequences_v")
        con.execute("DROP VIEW IF EXISTS final_nodes_v")
        con.execute("DROP VIEW IF EXISTS filtered_sequences_v")
        
        where_sql_literal = ""
        clauses = []
        if tagesart:
             clauses.append(f"d.tagesart_abbr = '{tagesart.replace(chr(39), chr(39)*2)}'")
        if time_from is not None and time_to is not None:
             clauses.append(f"s.frt_start BETWEEN {int(time_from)} AND {int(time_to)}")
        if richtung is not None:
             clauses.append(f"l.li_ri_no = {int(richtung)}")
        if clauses:
             where_sql_literal = "WHERE " + " AND ".join(clauses)

        con.execute(f"CREATE TEMP VIEW active_trips_v AS SELECT s.frt_id, s.route_id, l.li_no, l.li_ri_no, s.li_id, s.frt_start FROM cub_schedule s JOIN dim_date d ON s.day_id = d.day_id JOIN dim_line l ON s.li_id = l.li_id {where_sql_literal}")
        
        con.execute(f"CREATE TEMP VIEW whitelist_v AS SELECT col0 as stop_name FROM (VALUES {wl_values})")
        
        con.execute("""
            CREATE TEMP VIEW route_stops_v AS 
            SELECT r.route_id, r.li_lfd_nr, o.stop_point_text as stop_text, r.ideal_stop_nr, o.lat, o.lon
            FROM dim_route r JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
            WHERE o.stop_text NOT IN ('Rückfahrt', 'Hinfahrt', 'Endstation')
            QUALIFY ROW_NUMBER() OVER (PARTITION BY r.route_id, r.li_lfd_nr ORDER BY o.stop_point_no) = 1
        """)
        
        con.execute("""
            CREATE TEMP VIEW trip_sequences_v AS 
            SELECT a.frt_id, a.li_no, a.li_ri_no, a.frt_start, rs.li_lfd_nr, rs.stop_text, rs.ideal_stop_nr, rs.lat, rs.lon
            FROM active_trips_v a JOIN route_stops_v rs ON a.route_id = rs.route_id
        """)
        
        # FIXED STRING_AGG(DISTINCT category, ',') to avoid order by conflicts.
        con.execute("""
            CREATE TEMP VIEW final_nodes_v AS 
            WITH hub_counts AS (
                SELECT ideal_stop_nr, MAX(stop_text) as stop_text, COUNT(DISTINCT li_no) as line_count FROM trip_sequences_v GROUP BY ideal_stop_nr
            ),
            relevant_nodes AS (
                SELECT ideal_stop_nr, stop_text, 'hub' as category FROM hub_counts WHERE line_count >= 2
                UNION
                SELECT h.ideal_stop_nr, h.stop_text, 'whitelist' as category FROM hub_counts h JOIN whitelist_v w ON h.stop_text ILIKE '%' || w.stop_name || '%'
                UNION
                SELECT h.ideal_stop_nr, h.stop_text, 'terminal' as category FROM (
                    SELECT route_id, MIN(li_lfd_nr) as min_seq, MAX(li_lfd_nr) as max_seq FROM route_stops_v GROUP BY route_id
                ) minmax
                JOIN route_stops_v rs ON (rs.route_id = minmax.route_id AND (rs.li_lfd_nr = minmax.min_seq OR rs.li_lfd_nr = minmax.max_seq))
                JOIN hub_counts h ON h.ideal_stop_nr = rs.ideal_stop_nr
            ),
            aggregated_categories AS (
                 SELECT ideal_stop_nr, STRING_AGG(category, ',') as categories FROM (SELECT DISTINCT ideal_stop_nr, category FROM relevant_nodes) GROUP BY 1
            )
            SELECT r.ideal_stop_nr, MAX(r.stop_text) as stop_text, MAX(c.categories) as categories, MAX(rs.lat) as lat, MAX(rs.lon) as lon
            FROM relevant_nodes r 
            JOIN route_stops_v rs ON r.ideal_stop_nr = rs.ideal_stop_nr
            JOIN aggregated_categories c ON r.ideal_stop_nr = c.ideal_stop_nr
            GROUP BY r.ideal_stop_nr
        """)
        
        con.execute("""
            CREATE TEMP VIEW filtered_sequences_v AS 
            SELECT ts.frt_id, ts.li_no, ts.li_ri_no, ts.li_lfd_nr, ts.stop_text, ts.ideal_stop_nr, ts.frt_start
            FROM trip_sequences_v ts JOIN final_nodes_v fn ON ts.ideal_stop_nr = fn.ideal_stop_nr
        """)
        
        # 1. Fetch Nodes
        nodes_raw = con.execute("SELECT ideal_stop_nr, stop_text, categories, lat, lon FROM final_nodes_v").fetchall()
        nodes = [{"id": r[0], "name": r[1], "categories": r[2].split(','), "lat": r[3], "lon": r[4]} for r in nodes_raw]
        
        # 2. Fetch Abstract Edges
        edges_raw = con.execute("""
            WITH node_pairs AS (
                SELECT frt_id, li_no, li_ri_no, ideal_stop_nr as from_id, LEAD(ideal_stop_nr) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_id,
                       frt_start, LEAD(frt_start) OVER (PARTITION BY frt_id ORDER BY li_lfd_nr) as to_start
                FROM filtered_sequences_v
            )
            SELECT li_no, li_ri_no, from_id, to_id, COUNT(DISTINCT frt_id) as trip_volume, ROUND(AVG((to_start - frt_start) / 60.0)) as avg_duration
            FROM node_pairs WHERE to_id IS NOT NULL AND from_id != to_id AND (to_start - frt_start) >= 0
            GROUP BY li_no, li_ri_no, from_id, to_id
        """).fetchall()
        
        edges = [{"line_no": r[0], "direction": r[1], "from": r[2], "to": r[3], "trip_volume": r[4], "duration": r[5]} for r in edges_raw]
        
        # 3. Fetch Timetables per Node (Aggregated departure minutes)
        # Fixing STRING_AGG distinct here as well
        timetables_raw = con.execute("""
             WITH node_departures AS (
                SELECT ideal_stop_nr, li_no, li_ri_no, frt_start,
                       CAST(MOD(frt_start / 60, 60) AS INTEGER) as dep_minute,
                       LAG(frt_start) OVER (PARTITION BY ideal_stop_nr, li_no, li_ri_no ORDER BY frt_start) as prev_start
                FROM filtered_sequences_v
            ),
            unique_minutes AS (
                 SELECT DISTINCT ideal_stop_nr, li_no, li_ri_no, dep_minute FROM node_departures
            ),
            aggregated_minutes AS (
                 SELECT ideal_stop_nr, li_no, li_ri_no, STRING_AGG(CAST(dep_minute AS VARCHAR), ', ' ORDER BY dep_minute) as minutes
                 FROM unique_minutes GROUP BY 1, 2, 3
            ),
            node_intervals AS (
                SELECT ideal_stop_nr, li_no, li_ri_no, ROUND((frt_start - prev_start) / 60.0) as headway
                FROM node_departures WHERE prev_start IS NOT NULL AND (frt_start - prev_start) > 0
            ),
            base_takt AS (
                 SELECT ideal_stop_nr, li_no, li_ri_no, CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY headway) AS INTEGER) as takt
                 FROM node_intervals GROUP BY ideal_stop_nr, li_no, li_ri_no
            )
            SELECT a.ideal_stop_nr, a.li_no, a.li_ri_no, a.minutes, MAX(b.takt) as base_takt
            FROM aggregated_minutes a
            LEFT JOIN base_takt b ON a.ideal_stop_nr = b.ideal_stop_nr AND a.li_no = b.li_no AND a.li_ri_no = b.li_ri_no
            GROUP BY a.ideal_stop_nr, a.li_no, a.li_ri_no, a.minutes
        """).fetchall()
        
        timetables = {}
        for r in timetables_raw:
            node_id = r[0]
            if node_id not in timetables:
                timetables[node_id] = []
            timetables[node_id].append({
                "line_no": r[1],
                "direction": r[2],
                "minutes": r[3],
                "takt": int(r[4]) if r[4] else 0 # Convert to dict compatible bool/int
            })
            
        con.execute("DROP VIEW IF EXISTS active_trips_v")
        con.execute("DROP VIEW IF EXISTS whitelist_v")
        con.execute("DROP VIEW IF EXISTS route_stops_v")
        con.execute("DROP VIEW IF EXISTS trip_sequences_v")
        con.execute("DROP VIEW IF EXISTS final_nodes_v")
        con.execute("DROP VIEW IF EXISTS filtered_sequences_v")

        return {
             "nodes": nodes,
             "edges": edges,
             "timetables": timetables
        }

    except Exception as e:
        print(f"Network Nodes Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/corridor/matrix")
def get_corridor_matrix(
    stop_id: str = Query(..., description="Filter by Stop ID"),
    tagesart: str = Query(..., description="Tagesart Filter"),
    richtung: Optional[int] = Query(None, description="Richtung"),
    x_scenario: str = Header("strategic")
):
    try:
        con = get_db(x_scenario)
        richtung_filter = f"AND l.li_ri_no = {richtung}" if richtung else ""
        
        query = f"""
            SELECT 
                l.li_no,
                l.li_ri_no as richtung,
                (r.abfahrt // 3600) as std,
                ((r.abfahrt % 3600) // 60) as h_min
            FROM cub_route r
            JOIN cub_schedule s ON r.schedule_id = s.schedule_id
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            WHERE r.stop_id = ?
              AND d.tagesart_abbr = ?
              {richtung_filter}
        """
        # Execute query and deduplicate at database level using DISTINCT or group by
        # But we want all departures to plot them. Wait, if multiple days are in tagesart, we get duplicates
        # We should compute the average or just pick one day? A "Matrix" is usually a timetable.
        # So we should group by line, std, min to avoid overlapping same minutes from multiple days.
        query = f"""
            SELECT 
                l.li_no,
                l.li_ri_no as richtung,
                (r.abfahrt // 3600) as std,
                ((r.abfahrt % 3600) // 60) as h_min,
                CASE 
                    WHEN o_start.stop_abbr IN ('WSTR', 'WEI') OR o_end.stop_abbr IN ('WSTR', 'WEI') THEN true
                    WHEN o_start.stop_name ILIKE '%Depot%' OR o_end.stop_name ILIKE '%Depot%' THEN true
                    ELSE false 
                END as is_depot_run,
                COUNT(DISTINCT s.day_id) as days_active
            FROM cub_route r
            JOIN dim_ort o ON r.stop_id = o.stop_id
            JOIN cub_schedule s ON r.schedule_id = s.schedule_id
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            LEFT JOIN dim_ort o_start ON s.start_stop_id = o_start.stop_id
            LEFT JOIN dim_ort o_end ON s.end_stop_id = o_end.stop_id
            WHERE o.stop_abbr = ?
              AND d.tagesart_abbr = ?
              AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
              {richtung_filter}
            GROUP BY 1, 2, 3, 4, 5
            ORDER BY 3, 4
        """
        df = con.execute(query, [stop_id, tagesart]).df()
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Corridor Matrix Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/corridor/frequency")
def get_corridor_frequency(
    stop_id: str = Query(..., description="Filter by Stop ID"),
    tagesart: str = Query(..., description="Tagesart Filter"),
    richtung: Optional[int] = Query(None, description="Richtung"),
    x_scenario: str = Header("strategic")
):
    try:
        con = get_db(x_scenario)
        richtung_filter = f"AND l.li_ri_no = {richtung}" if richtung else ""
        
        # Get count of independent days in the selected tagesart that actually appear in the schedule
        days_count_query = """
            SELECT COUNT(DISTINCT s.day_id) 
            FROM cub_schedule s 
            JOIN dim_date d ON s.day_id = d.day_id 
            WHERE d.tagesart_abbr = ?
        """
        days_count = con.execute(days_count_query, [tagesart]).fetchone()[0]
        if not days_count:
            days_count = 1

        query = f"""
            SELECT 
                (r.abfahrt // 3600) as std,
                l.li_no,
                CASE 
                    WHEN o_start.stop_abbr IN ('WSTR', 'WEI') OR o_end.stop_abbr IN ('WSTR', 'WEI') THEN true
                    WHEN o_start.stop_name ILIKE '%Depot%' OR o_end.stop_name ILIKE '%Depot%' THEN true
                    ELSE false 
                END as is_depot_run,
                COUNT(r.abfahrt) * 1.0 / ? as trips_per_hour
            FROM cub_route r
            JOIN dim_ort o ON r.stop_id = o.stop_id
            JOIN cub_schedule s ON r.schedule_id = s.schedule_id
            JOIN dim_line l ON s.li_id = l.li_id
            JOIN dim_date d ON s.day_id = d.day_id
            LEFT JOIN dim_ort o_start ON s.start_stop_id = o_start.stop_id
            LEFT JOIN dim_ort o_end ON s.end_stop_id = o_end.stop_id
            WHERE o.stop_abbr = ?
              AND d.tagesart_abbr = ?
              AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
              {richtung_filter}
            GROUP BY 1, 2, 3
            ORDER BY 1, 2
        """
        df = con.execute(query, [days_count, stop_id, tagesart]).df()
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Corridor Frequency Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/corridor/headway")
def get_corridor_headway(
    stop_id: str = Query(..., description="Filter by Stop ID"),
    tagesart: str = Query(..., description="Tagesart Filter"),
    richtung: Optional[int] = Query(None, description="Richtung"),
    x_scenario: str = Header("strategic")
):
    try:
        con = get_db(x_scenario)
        richtung_filter = f"AND l.li_ri_no = {richtung}" if richtung else ""
        
        # Since tagesart can contain multiple days, we should select a REPRESENTATIVE day 
        # (e.g., the first day_id matching) so that LAG works linearly and doesn't jump between dates.
        # (e.g., the first day_id matching) so that LAG works linearly and doesn't jump between dates.
        first_day_query = """
            SELECT s.day_id 
            FROM cub_schedule s
            JOIN dim_date d ON s.day_id = d.day_id
            WHERE d.tagesart_abbr = ?
            GROUP BY s.day_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """
        first_day_row = con.execute(first_day_query, [tagesart]).fetchone()
        if not first_day_row:
            return []
        first_day = first_day_row[0]

        query = f"""
            WITH departures AS (
                SELECT 
                    s.schedule_id,
                    l.li_no,
                    r.abfahrt,
                    (r.abfahrt // 3600) as std,
                    ((r.abfahrt % 3600) // 60) as h_min,
                    CASE 
                        WHEN o_start.stop_abbr IN ('WSTR', 'WEI') OR o_end.stop_abbr IN ('WSTR', 'WEI') THEN true
                        WHEN o_start.stop_name ILIKE '%Depot%' OR o_end.stop_name ILIKE '%Depot%' THEN true
                        ELSE false 
                    END as is_depot_run
                FROM cub_route r
                JOIN dim_ort o ON r.stop_id = o.stop_id
                JOIN cub_schedule s ON r.schedule_id = s.schedule_id
                JOIN dim_line l ON s.li_id = l.li_id
                LEFT JOIN dim_ort o_start ON s.start_stop_id = o_start.stop_id
                LEFT JOIN dim_ort o_end ON s.end_stop_id = o_end.stop_id
                WHERE o.stop_abbr = ?
                  AND s.day_id = ?
                  AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
                  {richtung_filter}
                ORDER BY r.abfahrt
            )
            SELECT 
                std,
                h_min,
                abfahrt,
                li_no,
                is_depot_run,
                (abfahrt - LAG(abfahrt) OVER (ORDER BY abfahrt)) // 60 as headway_minutes
            FROM departures
        """
        df = con.execute(query, [stop_id, first_day]).df()
        # Drop the first row which has NULL headway
        df = df.dropna(subset=['headway_minutes']).copy()
        df['time_label'] = [f"{int(s):02d}:{int(m):02d}" for s, m in zip(df['std'], df['h_min'])]
        
        return df[['time_label', 'std', 'h_min', 'abfahrt', 'li_no', 'headway_minutes', 'is_depot_run']].to_dict(orient="records")
    except Exception as e:
        print(f"Corridor Headway Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/corridor/bildfahrplan")
def get_corridor_bildfahrplan(
    stop_id_start: str = Query(..., description="Start Stop ID"),
    stop_id_end: str = Query(..., description="End Stop ID"),
    tagesart: str = Query(..., description="Tagesart Filter"),
    x_scenario: str = Header("strategic")
):
    try:
        # A Bildfahrplan requires trips that pass through stop A and stop B and A comes before B.
        con = get_db(x_scenario)
        first_day_query = """
            SELECT s.day_id 
            FROM cub_schedule s
            JOIN dim_date d ON s.day_id = d.day_id
            WHERE d.tagesart_abbr = ?
            GROUP BY s.day_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """
        first_day_row = con.execute(first_day_query, [tagesart]).fetchone()
        if not first_day_row:
            return {"trips": []}
        first_day = first_day_row[0]

        query = """
            WITH valid_trips AS (
                SELECT 
                    r1.schedule_id,
                    r1.li_lfd_nr as seq_start,
                    r2.li_lfd_nr as seq_end
                FROM cub_route r1
                JOIN dim_ort o1 ON r1.stop_id = o1.stop_id
                JOIN cub_route r2 ON r1.schedule_id = r2.schedule_id
                JOIN dim_ort o2 ON r2.stop_id = o2.stop_id
                WHERE o1.stop_abbr = ? AND o2.stop_abbr = ? AND r1.li_lfd_nr < r2.li_lfd_nr
            )
            SELECT 
                v.schedule_id,
                l.li_no,
                r.stop_id,
                o.stop_abbr,
                o.stop_point_text as stop_text,
                r.li_lfd_nr,
                r.abfahrt,
                r.ankunft,
                r.abfahrt // 3600 as std,
                (r.abfahrt % 3600) // 60 as min,
                l.li_ri_no as richtung,
                COALESCE(o_start.stop_point_text, '') as fahrt_start_text,
                COALESCE(o_end.stop_point_text, '') as fahrt_end_text,
                CASE 
                    WHEN o_start.stop_abbr IN ('WSTR', 'WEI') OR o_end.stop_abbr IN ('WSTR', 'WEI') THEN true
                    WHEN o_start.stop_name ILIKE '%Depot%' OR o_end.stop_name ILIKE '%Depot%' THEN true
                    ELSE false 
                END as is_depot_run
            FROM valid_trips v
            JOIN cub_route r ON r.schedule_id = v.schedule_id 
                AND r.li_lfd_nr >= v.seq_start 
                AND r.li_lfd_nr <= v.seq_end
            JOIN cub_schedule s ON s.schedule_id = v.schedule_id
            JOIN dim_line l ON l.li_id = s.li_id
            JOIN dim_ort o ON o.stop_id = r.stop_id
            LEFT JOIN dim_ort o_start ON s.start_stop_id = o_start.stop_id
            LEFT JOIN dim_ort o_end ON s.end_stop_id = o_end.stop_id
            WHERE s.day_id = ?
              AND (s.fahrtart_nr IS NULL OR s.fahrtart_nr = 1)
            ORDER BY v.schedule_id, r.li_lfd_nr
        """
        df = con.execute(query, [stop_id_start, stop_id_end, first_day]).df()
        
        # Group by schedule_id into structured objects
        trips = []
        for schedule_id, group in df.groupby('schedule_id'):
            li_no = group.iloc[0]['li_no']
            is_depot_run = bool(group.iloc[0]['is_depot_run'])
            richtung = int(group.iloc[0]['richtung']) if group.iloc[0]['richtung'] is not None else None
            fahrt_start = str(group.iloc[0]['fahrt_start_text'])
            fahrt_end = str(group.iloc[0]['fahrt_end_text'])
            points = group.to_dict(orient="records")
            trips.append({
                "schedule_id": int(schedule_id),
                "li_no": str(li_no),
                "is_depot_run": is_depot_run,
                "richtung": richtung,
                "fahrt_start": fahrt_start,
                "fahrt_end": fahrt_end,
                "points": points
            })
            
        return {"trips": trips}
    except Exception as e:
        print(f"Corridor Bildfahrplan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/garaging")
def get_garaging(
    tagesart: str = Query("Mo-Do", description="Tagesart filter (Mo-Do, Fr, Sa, So/Ft)"),
    x_scenario: str = Header("strategic")
):
    """
    Get garaging data: Ausfahrten and Einfahrten per Umlauf and Depot.
    """
    con = get_db(x_scenario)
    try:
        where_clause = ""
        params = []
        if tagesart == "Mo-Do":
            where_clause = "WHERE (d.tagesart_abbr = 'Mo-Fr' OR d.tagesart_abbr = 'Mo-Do') AND d.wochentag_nr IN (0, 1, 2, 3)"
        elif tagesart == "Fr":
            # Support both strategic (Mo-Fr with wochentag 4) and operative (direct 'Fr' label)
            where_clause = "WHERE (d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr = 4) OR d.tagesart_abbr = 'Fr'"
        elif tagesart == "Sa":
            where_clause = "WHERE d.tagesart_abbr = 'Sa'"
        elif tagesart == "So/Ft":
            where_clause = "WHERE d.tagesart_abbr = 'So/Ft'"

        query = f"""
        WITH valid_umlauf AS (
            SELECT DISTINCT cs.umlauf_id, cs.day_id
            FROM cub_schedule cs
            JOIN dim_date d ON cs.day_id = d.day_id
            {where_clause}
        ),
        ausfahrten AS (
            SELECT 
                cs.umlauf_id,
                cs.li_id,
                o.stop_name as depot_aus_name,
                o.stop_ort as depot_aus_ort,
                cs.frt_start as event_time,
                cs.frt_start as ausfahrt_zeit,
                v.vehicle_type
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            JOIN dim_ort o ON cs.start_stop_id = o.stop_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 2
        ),
        einfahrten AS (
            SELECT 
                cs.umlauf_id,
                o.stop_name as depot_ein_name,
                o.stop_ort as depot_ein_ort,
                cs.frt_ende as event_time,
                cs.frt_ende as einfahrt_zeit,
                v.vehicle_type
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            JOIN dim_ort o ON cs.end_stop_id = o.stop_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 3
        )
        SELECT DISTINCT
            a.umlauf_id,
            a.li_id,
            l.li_abbr as line_no,
            a.depot_aus_ort || ', ' || a.depot_aus_name as depot_ausfahrt,
            e.depot_ein_ort || ', ' || e.depot_ein_name as depot_einfahrt,
            a.ausfahrt_zeit,
            e.einfahrt_zeit,
            a.vehicle_type,
            u.umlauf_kuerzel,
            (a.depot_aus_ort || ', ' || a.depot_aus_name) != (e.depot_ein_ort || ', ' || e.depot_ein_name) as is_asymmetric
        FROM ausfahrten a
        LEFT JOIN einfahrten e ON a.umlauf_id = e.umlauf_id
        LEFT JOIN dim_line l ON a.li_id = l.li_id
        LEFT JOIN dim_umlauf u ON a.umlauf_id = u.umlauf_id
        ORDER BY l.li_abbr, a.ausfahrt_zeit
        """
        
        peak_query = f"""
        WITH valid_umlauf AS (
            SELECT DISTINCT cs.umlauf_id, cs.day_id
            FROM cub_schedule cs
            JOIN dim_date d ON cs.day_id = d.day_id
            {where_clause}
        ),
        ausfahrten_distinct AS (
            SELECT DISTINCT v.vehicle_type, cs.umlauf_id, cs.frt_start as event_time
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 2
        ),
        einfahrten_distinct AS (
            SELECT DISTINCT v.vehicle_type, cs.umlauf_id, cs.frt_ende as event_time
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 3
        ),
        events AS (
            SELECT vehicle_type, event_time, 1 as change FROM ausfahrten_distinct
            UNION ALL
            SELECT vehicle_type, event_time, -1 as change FROM einfahrten_distinct
        ),
        running_sum AS (
            SELECT vehicle_type, event_time,
                   SUM(change) OVER (PARTITION BY vehicle_type ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as active_vehicles
            FROM events
        ),
        day_count AS (
            SELECT COUNT(DISTINCT day_id) as n_days FROM valid_umlauf
        )
        SELECT 
            vehicle_type, 
            MAX(active_vehicles) / (SELECT n_days FROM day_count) as max_vehicles_needed
        FROM running_sum
        WHERE vehicle_type IS NOT NULL
        GROUP BY vehicle_type
        ORDER BY max_vehicles_needed DESC
        """
        
        depot_query = f"""
        WITH valid_umlauf AS (
            SELECT DISTINCT cs.umlauf_id, cs.day_id
            FROM cub_schedule cs
            JOIN dim_date d ON cs.day_id = d.day_id
            {where_clause}
        ),
        ausfahrten AS (
            SELECT DISTINCT
                cs.umlauf_id,
                cs.day_id,
                v.vehicle_type,
                CASE 
                    WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Weinbergli'
                    WHEN o.stop_ort LIKE '%Root%' THEN 'Root'
                    WHEN o.stop_ort LIKE '%Rothenburg%' OR o.stop_name LIKE '%Rothenburg%' THEN 'Rothenburg'
                    ELSE o.stop_ort || ', ' || o.stop_name
                END as depot_name
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            JOIN dim_ort o ON cs.start_stop_id = o.stop_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 2
        ),
        einfahrten AS (
            SELECT DISTINCT
                cs.umlauf_id,
                cs.day_id,
                v.vehicle_type,
                CASE 
                    WHEN o.stop_ort LIKE '%Luzern%' OR o.stop_name LIKE '%Weinbergli%' THEN 'Weinbergli'
                    WHEN o.stop_ort LIKE '%Root%' THEN 'Root'
                    WHEN o.stop_ort LIKE '%Rothenburg%' OR o.stop_name LIKE '%Rothenburg%' THEN 'Rothenburg'
                    ELSE o.stop_ort || ', ' || o.stop_name
                END as depot_name
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
            JOIN dim_fahrt f ON cs.frt_id = f.frt_id
            JOIN dim_ort o ON cs.end_stop_id = o.stop_id
            LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
            WHERE f.fahrt_typ = 3
        ),
        day_count AS (
            SELECT COUNT(DISTINCT day_id) as n_days FROM valid_umlauf
        )
        SELECT 
            COALESCE(a.depot_name, e.depot_name) as depot,
            COALESCE(a.vehicle_type, e.vehicle_type) as vehicle_type,
            CAST(COUNT(DISTINCT a.umlauf_id || '_' || a.day_id) AS FLOAT) / (SELECT n_days FROM day_count) as ausfahrten_count,
            CAST(COUNT(DISTINCT e.umlauf_id || '_' || e.day_id) AS FLOAT) / (SELECT n_days FROM day_count) as einfahrten_count
        FROM ausfahrten a
        FULL OUTER JOIN einfahrten e ON a.depot_name = e.depot_name AND a.umlauf_id = e.umlauf_id AND a.day_id = e.day_id AND COALESCE(a.vehicle_type, '') = COALESCE(e.vehicle_type, '')
        GROUP BY 1, 2
        ORDER BY 1, 3 DESC NULLS LAST
        """

        peak_line_query = f"""
        WITH valid_umlauf AS (
            SELECT DISTINCT cs.umlauf_id, cs.day_id
            FROM cub_schedule cs
            JOIN dim_date d ON cs.day_id = d.day_id
            {where_clause}
        ),
        trips_distinct AS (
            SELECT DISTINCT
                l.li_abbr as line_no,
                v.vehicle_type,
                cs.umlauf_id,
                cs.day_id,
                cs.frt_start as event_start,
                cs.frt_ende as event_end
            FROM cub_schedule cs
            JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id AND cs.day_id = vu.day_id
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
        ),
        day_count AS (
            SELECT COUNT(DISTINCT day_id) as n_days FROM valid_umlauf
        )
        SELECT 
            line_no, 
            vehicle_type, 
            MAX(active_vehicles) / (SELECT n_days FROM day_count) as max_vehicles_needed
        FROM running_sum
        WHERE line_no IS NOT NULL
        GROUP BY line_no, vehicle_type
        HAVING MAX(active_vehicles) > 0
        ORDER BY
           -- custom sort to sort lines numerically where possible
           CASE WHEN string_split(line_no, ' ')[1]~'^[0-9]+$' THEN CAST(string_split(line_no, ' ')[1] AS INT) ELSE 9999 END, line_no
        """
        
        result_details = con.execute(query).fetchall()
        result_peak = con.execute(peak_query).fetchall()
        result_depot = con.execute(depot_query).fetchall()
        result_peak_line = con.execute(peak_line_query).fetchall()
        
        details = []
        for row in result_details:
            details.append({
                "umlauf_id": row[0],
                "li_id": row[1],
                "line_no": row[2] if row[2] else 'Unbekannt',
                "depot_ausfahrt": row[3],
                "depot_einfahrt": row[4],
                "ausfahrt_zeit": row[5],
                "einfahrt_zeit": row[6],
                "vehicle_type": row[7] if row[7] else 'Unbekannt',
                "umlauf_kuerzel": row[8] if row[8] else f"Umlauf {row[0]}",
                "is_asymmetric": bool(row[9])
            })
            
        peak_vehicles = []
        for row in result_peak:
            peak_vehicles.append({
                "vehicle_type": row[0],
                "max_vehicles_needed": int(row[1]) if row[1] is not None else 0
            })
            
        vehicles_per_depot = []
        for row in result_depot:
            vehicles_per_depot.append({
                "depot": row[0],
                "vehicle_type": row[1] if row[1] else "Unbekannt",
                "ausfahrten_count": int(row[2]) if row[2] is not None else 0,
                "einfahrten_count": int(row[3]) if row[3] is not None else 0
            })
            
        peak_per_line = []
        for row in result_peak_line:
            peak_per_line.append({
                "line_no": row[0],
                "vehicle_type": row[1] if row[1] else "Unbekannt",
                "max_vehicles_needed": int(row[2]) if row[2] is not None else 0
            })
            
        return {
            "details": details,
            "peak_vehicles": peak_vehicles,
            "vehicles_per_depot": vehicles_per_depot,
            "peak_per_line": peak_per_line
        }
    except Exception as e:
        print(f"Garaging Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

