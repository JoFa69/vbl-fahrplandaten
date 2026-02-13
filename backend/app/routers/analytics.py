from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ..database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/stats")
async def get_general_stats():
    con = get_db()
    try:
        # Count lines
        lines = con.execute("SELECT COUNT(DISTINCT li_no) FROM dim_line").fetchone()[0]
        # Count stops
        stops = con.execute("SELECT COUNT(DISTINCT stop_no) FROM dim_ort").fetchone()[0]
        # Count trips (approximate from cub_schedule)
        trips = con.execute("SELECT COUNT(*) FROM cub_schedule").fetchone()[0]
        
        return {
            "total_lines": lines,
            "total_stops": stops,
            "total_planned_trips": trips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stops-by-line")
async def get_stops_by_line():
    con = get_db()
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
        # Fallback for debugging - print schema or just fail gracefully
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trips-per-hour")
async def get_trips_per_hour():
    con = get_db()
    try:
        # Group trips by hour of start time
        # frt_start is in seconds. Hour = frt_start / 3600
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
    """
    Get volume metrics (trip counts) with drill-through capability.
    - Default: Trips per Line Number (aggregated).
    - group_by="hour": Trips per Hour (can be filtered by line_no).
    - group_by="direction": Trips per Direction (can be filtered by line_no).
    """
    con = get_db()
    try:
        where_clause = ""
        params = []
        
        if line_no is not None:
            where_clause = "WHERE l.li_no = ?"
            params.append(line_no)

        if group_by == "line":
            # Count trips per line NUMBER (aggregating all variations/directions of that line)
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
            # Count trips per hour
            # Need join with dim_line if filtering by line_no
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
            # Count trips per direction
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
            
        # Execute
        result = con.execute(query, params).fetchall()
            
        # Format response
        data = []
        for row in result:
            item = {"label": str(row[0]), "value": row[1]}
            if group_by == "line":
               # label is li_no, name is li_text, value is count
               item = {
                   "label": str(row[0]), 
                   "name": row[1], 
                   "value": row[2],
                   "id": str(row[0]) # Use li_no as ID for drill down
               }
            else:
               item = {
                   "label": str(row[0]), 
                   "value": row[1]
               }
            data.append(item)
            
        return data

    except Exception as e:
        print(f"Volume Metrics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/geometry")
async def get_geometry_metrics(
    type: str = Query("lines", enum=["lines", "variants", "stops"], description="Type of geometry data"),
    line_id: Optional[int] = Query(None, description="Line ID for variants"),
    variant_id: Optional[int] = Query(None, description="Route ID for stops")
):
    """
    Get network geometry metrics.
    - type="lines": List of all lines.
    - type="variants": List of variants for a specific line_id.
    - type="stops": List of stops for a specific variant_id (route_id).
    """
    con = get_db()
    try:
        if type == "lines":
            # List all lines with basic stats
            query = """
                SELECT 
                    l.li_id, 
                    l.li_no, 
                    l.li_text, 
                    COUNT(DISTINCT s.route_id) as variant_count
                FROM dim_line l
                LEFT JOIN cub_schedule s ON l.li_id = s.li_id
                GROUP BY l.li_id, l.li_no, l.li_text
                ORDER BY CAST(l.li_no AS INTEGER) ASC
            """
            result = con.execute(query).fetchall()
            return [
                {"id": row[0], "line_no": row[1], "name": row[2], "variants": row[3]}
                for row in result
            ]

        elif type == "variants":
            if not line_id:
                raise HTTPException(status_code=400, detail="line_id is required for variants")
                
            # List variants (routes) for a line
            # distinct routes from cub_schedule linked to this line, or from dim_route?
            # dim_route doesn't have line_id directly, usually via cub_schedule or dim_line linkage?
            # Wait, verify schema. dim_route has 'li_lfd_nr' but maybe not li_id.
            # We can join cub_schedule to find active routes for this line.
            query = """
                SELECT DISTINCT 
                    r.route_id, 
                    r.route_hash,   
                    count(*) as stop_count
                FROM cub_schedule s
                JOIN dim_route r ON s.route_id = r.route_id
                WHERE s.li_id = ?
                GROUP BY r.route_id, r.route_hash
                ORDER BY stop_count DESC
            """
            result = con.execute(query, [line_id]).fetchall()
            return [
                {"id": row[0], "hash": row[1], "stop_count": row[2]}
                for row in result
            ]

        elif type == "stops":
            if not variant_id:
                raise HTTPException(status_code=400, detail="variant_id (route_id) is required for stops")
                
            # List stops for a route
            query = """
                SELECT 
                    r.ideal_stop_nr, 
                    r.ideal_stop_text, 
                    o.lat, 
                    o.lon,
                    r.li_lfd_nr as seq
                FROM dim_route r
                LEFT JOIN dim_ort o ON r.ideal_stop_nr = o.stop_abbr
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
async def get_infrastructure_metrics(
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


