from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from typing import List, Optional
import math

from ..database import get_db

router = APIRouter(prefix="/api/umlaeufe", tags=["umlaeufe"])

class UmlaufSummary(BaseModel):
    total_umlaeufe: int
    total_fahrten: int
    avg_dauer_minuten: float
    total_distanz_km: float

class UmlaufDetail(BaseModel):
    umlauf_id: int
    anzahl_fahrten: int
    start_zeit_sekunden: int
    ende_zeit_sekunden: int
    dauer_stunden: float
    distanz_km: float

class UmlaufListResponse(BaseModel):
    data: List[UmlaufDetail]
    total: int
    page: int
    size: int
    pages: int

@router.get("/summary", response_model=UmlaufSummary)
def get_umlaeufe_summary(tagesart: Optional[str] = Query("Alle", description="Tagesart Filter"), x_scenario: str = Header("strategic")):
    """Returns aggregated KPIs for all Umläufe."""
    try:
        conn = get_db(x_scenario)
        
        where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
        if tagesart and tagesart != "Alle":
            where_clause += f" AND d.tagesart_abbr = '{tagesart}'"
            
        # Calculate totals. We need to sum per umlauf first, then aggregate.
        query = f"""
        WITH umlauf_stats AS (
            SELECT 
                s.umlauf_id,
                COUNT(DISTINCT s.schedule_id) as fahrten,
                MIN(s.frt_start) as start_zeit,
                MAX(s.frt_ende) as ende_zeit,
                (MAX(s.frt_ende) - MIN(s.frt_start)) as dauer_sec,
                SUM(r.laenge) as distanz_m
            FROM cub_schedule s
            LEFT JOIN cub_route r ON s.schedule_id = r.schedule_id
            LEFT JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY s.umlauf_id
        )
        SELECT 
            COUNT(umlauf_id) as total_umlaeufe,
            SUM(fahrten) as total_fahrten,
            AVG(dauer_sec) / 60.0 as avg_dauer_min,
            SUM(distanz_m) / 1000.0 as total_distanz_km
        FROM umlauf_stats
        """
        
        df = conn.execute(query).df()
        
        if df.empty or df.isna().all().all():
            return {
                "total_umlaeufe": 0,
                "total_fahrten": 0,
                "avg_dauer_minuten": 0.0,
                "total_distanz_km": 0.0
            }
            
        row = df.iloc[0]
        return {
            "total_umlaeufe": int(row['total_umlaeufe']) if not math.isnan(row['total_umlaeufe']) else 0,
            "total_fahrten": int(row['total_fahrten']) if not math.isnan(row['total_fahrten']) else 0,
            "avg_dauer_minuten": float(row['avg_dauer_min']) if not math.isnan(row['avg_dauer_min']) else 0.0,
            "total_distanz_km": float(row['total_distanz_km']) if not math.isnan(row['total_distanz_km']) else 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=UmlaufListResponse)
def get_umlaeufe_list(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=1000),
    sort_by: str = Query("umlauf_id", description="Field to sort by"),
    sort_desc: bool = Query(False, description="Sort descending"),
    tagesart: Optional[str] = Query("Alle", description="Tagesart Filter"),
    x_scenario: str = Header("strategic")
):
    """Returns a list of all Umläufe with their details."""
    try:
        conn = get_db(x_scenario)
        
        # Valid sort fields to prevent SQL injection
        valid_sort_fields = {
            "umlauf_id": "umlauf_id",
            "anzahl_fahrten": "anzahl_fahrten",
            "start_zeit_sekunden": "start_zeit_sekunden",
            "ende_zeit_sekunden": "ende_zeit_sekunden",
            "dauer_stunden": "dauer_stunden",
            "distanz_km": "distanz_km"
        }
        
        sort_column = valid_sort_fields.get(sort_by, "umlauf_id")
        sort_order = "DESC" if sort_desc else "ASC"
        
        offset = (page - 1) * size
        
        where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
        if tagesart and tagesart != "Alle":
            where_clause += f" AND d.tagesart_abbr = '{tagesart}'"
            
        # Base query for aggregation
        base_query = f"""
        SELECT 
            s.umlauf_id,
            COUNT(DISTINCT s.schedule_id) as anzahl_fahrten,
            MIN(s.frt_start) as start_zeit_sekunden,
            MAX(s.frt_ende) as ende_zeit_sekunden,
            (MAX(s.frt_ende) - MIN(s.frt_start)) / 3600.0 as dauer_stunden,
            COALESCE(SUM(r.laenge), 0) / 1000.0 as distanz_km
        FROM cub_schedule s
        LEFT JOIN (
            SELECT schedule_id, SUM(laenge) as laenge
            FROM cub_route
            GROUP BY schedule_id
        ) r ON s.schedule_id = r.schedule_id
        LEFT JOIN dim_date d ON s.day_id = d.day_id
        {where_clause}
        GROUP BY s.umlauf_id
        """
        
        # Count total records
        count_query = f"SELECT COUNT(*) as total FROM ({base_query}) q"
        total_count = int(conn.execute(count_query).df().iloc[0]['total'])
        
        # Pagination query
        paginated_query = f"""
        SELECT * FROM ({base_query}) q
        ORDER BY {sort_column} {sort_order}, umlauf_id ASC
        LIMIT {size} OFFSET {offset}
        """
        
        df = conn.execute(paginated_query).df()
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "umlauf_id": int(row['umlauf_id']),
                "anzahl_fahrten": int(row['anzahl_fahrten']),
                "start_zeit_sekunden": int(row['start_zeit_sekunden']) if not math.isnan(row['start_zeit_sekunden']) else 0,
                "ende_zeit_sekunden": int(row['ende_zeit_sekunden']) if not math.isnan(row['ende_zeit_sekunden']) else 0,
                "dauer_stunden": float(row['dauer_stunden']) if not math.isnan(row['dauer_stunden']) else 0.0,
                "distanz_km": float(row['distanz_km']) if not math.isnan(row['distanz_km']) else 0.0
            })
            
        pages = math.ceil(total_count / size) if size > 0 else 0
        
        return {
            "data": results,
            "total": total_count,
            "page": page,
            "size": size,
            "pages": pages
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class GanttTrip(BaseModel):
    schedule_id: int
    li_no: Optional[str] = None
    start_zeit_sekunden: int
    ende_zeit_sekunden: int

class GanttUmlauf(BaseModel):
    umlauf_id: int
    fahrten: List[GanttTrip]

class ActiveVehiclePoint(BaseModel):
    time_label: str
    active_count: int

class ChartStats(BaseModel):
    umlauf_id: int
    dauer_stunden: float
    distanz_km: float
    anzahl_fahrten: int

@router.get("/gantt", response_model=List[GanttUmlauf])
def get_umlaeufe_gantt(day_type: Optional[str] = Query("Alle", description="Tagesart Filter"), limit: int = Query(50, ge=1, le=500), x_scenario: str = Header("strategic")):
    try:
        conn = get_db(x_scenario)
        
        where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
        if day_type and day_type != "Alle":
            where_clause += f" AND d.tagesart_abbr = '{day_type}'"
            
        # Find the top N umläufe by number of trips to keep gantt performant
        top_query = f"""
            SELECT s.umlauf_id 
            FROM cub_schedule s
            LEFT JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY s.umlauf_id 
            ORDER BY COUNT(*) DESC 
            LIMIT {limit}
        """
        top_df = conn.execute(top_query).df()
        if top_df.empty:
            return []
        
        umlauf_ids = ",".join(str(uid) for uid in top_df['umlauf_id'].tolist())
        
        query = f"""
            SELECT 
                s.umlauf_id,
                s.schedule_id,
                l.li_no,
                s.frt_start as start_zeit_sekunden,
                s.frt_ende as ende_zeit_sekunden
            FROM cub_schedule s
            LEFT JOIN dim_line l ON s.li_id = l.li_id
            LEFT JOIN dim_date d ON s.day_id = d.day_id
            {where_clause} AND s.umlauf_id IN ({umlauf_ids})
            ORDER BY s.umlauf_id, s.frt_start
        """
        df = conn.execute(query).df()
        
        result_map = {}
        for _, row in df.iterrows():
            uid = int(row['umlauf_id'])
            if uid not in result_map:
                result_map[uid] = []
            
            result_map[uid].append({
                "schedule_id": int(row['schedule_id']),
                "li_no": str(row['li_no']) if row['li_no'] else "N/A",
                "start_zeit_sekunden": int(row['start_zeit_sekunden']) if not math.isnan(row['start_zeit_sekunden']) else 0,
                "ende_zeit_sekunden": int(row['ende_zeit_sekunden']) if not math.isnan(row['ende_zeit_sekunden']) else 0
            })
            
        gantt_list = []
        for uid, fahrten in result_map.items():
            gantt_list.append({
                "umlauf_id": uid,
                "fahrten": fahrten
            })
            
        return gantt_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active_vehicles", response_model=List[ActiveVehiclePoint])
def get_active_vehicles(day_type: Optional[str] = Query("Alle", description="Tagesart Filter"), x_scenario: str = Header("strategic")):
    try:
        conn = get_db(x_scenario)
        
        where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
        if day_type and day_type != "Alle":
            where_clause += f" AND d.tagesart_abbr = '{day_type}'"
            
        # Get min_start and max_ende per umlauf
        query = f"""
            SELECT 
                s.umlauf_id,
                MIN(s.frt_start) as min_start,
                MAX(s.frt_ende) as max_ende
            FROM cub_schedule s
            LEFT JOIN dim_date d ON s.day_id = d.day_id
            {where_clause}
            GROUP BY s.umlauf_id
        """
        df = conn.execute(query).df()
        
        # 4:00 (14400) to 26:00 (93600) every 15 mins (900 seconds)
        start_sec = 14400
        end_sec = 93600
        step_sec = 900
        
        results = []
        for t in range(start_sec, end_sec + step_sec, step_sec):
            active_count = len(df[(df['min_start'] <= t) & (df['max_ende'] > t)])
            h = math.floor(t / 3600)
            m = math.floor((t % 3600) / 60)
            time_label = f"{h:02d}:{m:02d}"
            
            results.append({
                "time_label": time_label,
                "active_count": int(active_count)
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/charts_stats", response_model=List[ChartStats])
def get_charts_stats(day_type: Optional[str] = Query("Alle", description="Tagesart Filter"), x_scenario: str = Header("strategic")):
    try:
        conn = get_db(x_scenario)
        
        where_clause = "WHERE s.umlauf_id IS NOT NULL AND s.umlauf_id != 0"
        if day_type and day_type != "Alle":
            where_clause += f" AND d.tagesart_abbr = '{day_type}'"
            
        query = f"""
        SELECT 
            s.umlauf_id,
            COUNT(DISTINCT s.schedule_id) as anzahl_fahrten,
            (MAX(s.frt_ende) - MIN(s.frt_start)) / 3600.0 as dauer_stunden,
            COALESCE(SUM(r.laenge), 0) / 1000.0 as distanz_km
        FROM cub_schedule s
        LEFT JOIN (
            SELECT schedule_id, SUM(laenge) as laenge
            FROM cub_route
            GROUP BY schedule_id
        ) r ON s.schedule_id = r.schedule_id
        LEFT JOIN dim_date d ON s.day_id = d.day_id
        {where_clause}
        GROUP BY s.umlauf_id
        """
        df = conn.execute(query).df()
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "umlauf_id": int(row['umlauf_id']),
                "anzahl_fahrten": int(row['anzahl_fahrten']),
                "dauer_stunden": float(row['dauer_stunden']) if not math.isnan(row['dauer_stunden']) else 0.0,
                "distanz_km": float(row['distanz_km']) if not math.isnan(row['distanz_km']) else 0.0
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
