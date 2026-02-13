from fastapi import APIRouter, HTTPException
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
    
    # Get data
    query = f"SELECT * FROM '{table_name}' LIMIT {limit} OFFSET {offset}"
    df = con.execute(query).df()
    
    # Handle NaN for JSON serialization
    data = df.fillna("").to_dict(orient="records")
    
    return {
        "columns": columns,
        "data": data,
        "total_rows": len(data) # This is just page size, real count is separate query if needed
    }

@router.get("/stats")
def get_stats():
    con = get_db()
    tables = [x[0] for x in con.execute("SHOW TABLES").fetchall()]
    stats = []
    for t in tables:
        try:
            count = con.execute(f"SELECT COUNT(*) FROM '{t}'").fetchone()[0]
            stats.append({"table": t, "rows": count})
        except:
            pass
    return stats
