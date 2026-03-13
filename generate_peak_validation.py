import duckdb
import pandas as pd
import os

con = duckdb.connect('20261231_fahrplandaten_2027.db', read_only=True)

# Corrected peak logic grouping by DISTINCT umlauf to avoid multiplying by days
query = """
WITH valid_umlauf AS (
    SELECT DISTINCT cs.umlauf_id
    FROM cub_schedule cs
    JOIN dim_date d ON cs.day_id = d.day_id
    WHERE d.tagesart_abbr = 'Mo-Fr' AND d.wochentag_nr IN (0, 1, 2, 3)
),
ausfahrten AS (
    SELECT DISTINCT
        cs.umlauf_id,
        cs.frt_start as event_time,
        v.vehicle_type
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    WHERE f.fahrt_typ = 2
),
einfahrten AS (
    SELECT DISTINCT
        cs.umlauf_id,
        cs.frt_ende as event_time,
        v.vehicle_type
    FROM cub_schedule cs
    JOIN valid_umlauf vu ON cs.umlauf_id = vu.umlauf_id
    JOIN dim_fahrt f ON cs.frt_id = f.frt_id
    LEFT JOIN dim_vehicle v ON cs.vehicle_id = v.vehicle_id
    WHERE f.fahrt_typ = 3
),
events AS (
    SELECT vehicle_type, umlauf_id, event_time, 1 as change, 'Ausfahrt' as type FROM ausfahrten
    UNION ALL
    SELECT vehicle_type, umlauf_id, event_time, -1 as change, 'Einfahrt' as type FROM einfahrten
),
running_sum AS (
    SELECT 
        vehicle_type, 
        umlauf_id,
        event_time, 
        type,
        change,
        SUM(change) OVER (PARTITION BY vehicle_type ORDER BY event_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as active_vehicles
    FROM events
)
SELECT * FROM running_sum
ORDER BY vehicle_type, event_time
"""

df = con.execute(query).df()

# Format time helper
def format_time(seconds):
    if pd.isna(seconds): return "-"
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    return f"{h:02d}:{m:02d}"

df['Zeit'] = df['event_time'].apply(format_time)

# Get the max value per type
max_df = df.groupby('vehicle_type')['active_vehicles'].max().reset_index()

with open('c:/Users/Joche/.gemini/antigravity/brain/4083ac11-c381-479e-b245-11c80d765fd5/peak_vehicle_validation.md', 'w', encoding='utf-8') as f:
    f.write("# Validierung Spitzenbedarf Fahrzeuge (Mo-Do)\n\n")
    f.write("Diese Tabelle zeichnet die Anzahl gleichzeitiger Fahrzeuge pro Minute (kumuliert durch Ausfahrten `+1` und Einfahrten `-1`) für den Tagestyp Mo-Do auf, kollabiert über alle exakt gleichen Fahrplänen.\n\n")
    
    f.write("## Spitzenbedarf pro Fahrzeugtyp\n")
    f.write("| Fahrzeugtyp | Max. Gleichzeitig |\n")
    f.write("|-------------|------------------|\n")
    for _, row in max_df.iterrows():
        f.write(f"| {row['vehicle_type']} | {int(row['active_vehicles'])} |\n")
        
    f.write("\n## Detaillierter zeitlicher Verlauf (Auszug)\n")
    
    # We will pick a specific vehicle type that is easy to check, like 'Elektro Midibus'
    focus_type = 'Elektro Midibus'
    f.write(f"### Beispielverlauf für: {focus_type}\n")
    f.write("| Zeit | Ereignis | Änderung | Umlauf ID | Aktive Fahrzeuge auf Strecke |\n")
    f.write("|------|----------|----------|-----------|------------------------------|\n")
    sub_df = df[df['vehicle_type'] == focus_type]
    for _, row in sub_df.iterrows():
        f.write(f"| {row['Zeit']} | {row['type']} | {row['change']:+d} | {row['umlauf_id']} | **{int(row['active_vehicles'])}** |\n")

print("Validation artifact generated.")
con.close()
