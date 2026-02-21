import os
import duckdb
from google import genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..database import get_db

router = APIRouter(prefix="/ai", tags=["ai"])

# Configure Gemini Client
# The client should be instantiated where it's needed or lazily if possible, 
# but for simplicity and to follow the previous pattern (but with the new SDK):
def get_genai_client():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Warning: GOOGLE_API_KEY not found in environment variables.")
        return None
    return genai.Client(api_key=api_key)

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sql: str
    data: list

SYSTEM_PROMPT = """
You are an expert SQL Assistant for a DuckDB database containing public transport schedule data (VDV 452 standard).
Your job is to translate natural language questions into executable DuckDB SQL queries.

The database has the following key tables:
- dim_line (li_no, li_text, li_ri_no): Bus lines. row example: {'li_no': '1', 'li_text': 'Ostring', 'li_ri_no': 1}
- dim_ort (stop_no, stop_text, lat, lon): Bus stops. row example: {'stop_text': 'Bahnhof', 'lat': 52.5, 'lon': 13.4}
- cub_schedule (li_id, start_stop_id, end_stop_id, day_id, frt_start): Planned trips. 'frt_start' is seconds from midnight.
- dim_date (day_id, day_date, wochentag_text): Date dimension.
- dim_time (time_id, time_text): Time dimension.

Rules:
1. Return ONLY the SQL query. No markdown formatting, no explanations.
2. The SQL must be valid DuckDB SQL.
3. If the question cannot be answered with the given schema, return "SELECT 'I cannot answer this question with the available data' as message".
4. Limit results to 50 rows unless specified otherwise.
5. Use LIKE for string matching (case-insensitive if possible, e.g. ILIKE).
"""

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    client = get_genai_client()
    if not client:
        raise HTTPException(status_code=500, detail="Google API Key not configured.")

    try:
        prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {request.question}\nSQL Query:"
        
        response = client.models.generate_content(
            model='gemini-3-pro-preview',
            contents=prompt
        )
        
        # Clean up code blocks if present (the new SDK might still return them if the model outputs them)
        if response.text:
             sql_query = response.text.strip().replace("```sql", "").replace("```", "").strip()
        else:
             raise HTTPException(status_code=500, detail="Empty response from AI model.")

        
        # Security check: only allow SELECT
        if not sql_query.upper().startswith("SELECT"):
             raise HTTPException(status_code=400, detail="Only SELECT queries are allowed.")

        con = get_db()
        # Execute Query
        result = con.execute(sql_query).fetchall()
        
        if not result:
            return AskResponse(answer="No data found.", sql=sql_query, data=[])

        # Get column names
        # In DuckDB python client, description is sometimes not available directly on cursor if using shortcut
        # But 'execute' returns a relation or cursor. 
        # Let's use specific connection cursor to be safe or inspect description from the result object if it was a relation.
        # 'con.execute' on a connection returns a format that might need '.description' access carefully.
        # Actually, best way in DuckDB with execute() is:
        # columns = [desc[0] for desc in con.description] (works if con is a cursor or connection that ran the query)
        
        columns = [desc[0] for desc in con.description]
        
        # Format data as list of dicts
        data = [dict(zip(columns, row)) for row in result]
        
        return AskResponse(
            answer="Hier sind die gefundenen Daten:", 
            sql=sql_query,
            data=data
        )

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
