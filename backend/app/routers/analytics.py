from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ..database import get_db
import os






router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/stats")
def get_general_stats(reference_id: Optional[str] = Query(None, description="Fahrplan Reference ID for comparison")):
    con = get_db()
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
def get_stops_by_line():
    con = get_db()
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
def get_trips_per_hour():
    # ... (unchanged)
    con = get_db()
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
    group_by: str = Query("line", enum=["line", "hour", "direction"], description="Grouping dimension")
):
    # ... (unchanged logic for volume metrics charts)
    con = get_db()
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
                    COUNT(DISTINCT s.frt_id) as value
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
                    COUNT(DISTINCT s.frt_id) as value
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
                    COUNT(DISTINCT s.frt_id) as value
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
    fahrtart: Optional[int] = Query(None, description="Trip type filter (1=Normal, 2=Einsetz, 3=Aussetz)")
):
    """
    Get network geometry metrics.
    - type="lines": List of all lines.
    - type="variants": List of variants for a specific line_id with extended info.
    - type="stops": List of stops for a specific variant_id (route_id).
    """
    con = get_db()
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
    metric: str = Query("duration", enum=["duration", "speed"], description="Metric type")
):
    """
    Get time-based metrics.
    - metric="duration": Average trip duration (minutes).
      - Default: Avg duration per Line.
      - line_id: Avg duration per Variant (Route).
      - variant_id: Avg duration per Hour of day (Profil-Varianz).
    """
    con = get_db()
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
    limit: int = 10
):
    """
    Get infrastructure metrics (Stop Load).
    - Default: Top busiest stops.
    - stop_id: Load profile (events per hour) for a specific stop.
    """
    con = get_db()
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
                    o.stop_text as label,
                    COUNT(*) as value,
                    r.ideal_stop_nr as id
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
                WHERE o.stop_text NOT IN ('Hinfahrt', 'Rückfahrt', 'Endstation')
                GROUP BY o.stop_text, r.ideal_stop_nr
                ORDER BY value DESC
                LIMIT ?
            """
            result = con.execute(query, [limit]).fetchall()
            return [{"label": row[0], "value": row[1], "id": row[2]} for row in result]

    except Exception as e:
        print(f"Infrastructure Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/geometry/route/{line_no}")
async def get_route_geometry(line_no: str, route_id: Optional[int] = Query(None)):
    """
    Get route geometry for a specific line.
    If route_id is provided, returns geometry for that specific variant as a list with one item.
    Otherwise, returns all variants for the line with their respective volume and coordinates.
    """
    con = get_db()
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
    fahrtart: Optional[int] = Query(None, description="Trip type filter")
):
    """
    Get the primary route geometry for all lines (e.g., Variant 1, Direction 1).
    Used for the initial map overview.
    """
    con = get_db()
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
