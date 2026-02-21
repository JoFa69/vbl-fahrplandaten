# Datenfluss-Analyse: Vom VDV-File zum Dashboard

## Übersicht

Diese Analyse beschreibt den Weg der Daten von der Quelle bis zur Anzeige im Dashboard und identifiziert, an welchen Stellen Informationen verloren gehen oder verfälscht werden könnten.

```mermaid
graph TD
    A[VDV-Dateien (.x10)] -->|import_vdv.py| B(DuckDB: vdv_schedule.duckdb)
    C[Opendata.swiss CSV] -->|etl_update_geometries.py| D(DuckDB: vdv_schedule.duckdb / main db)
    B --> E{Data Warehouse Process}
    D --> E
    E --> F[DuckDB: main.db]
    F -->|Zeilen & Fahrten| G[Tabelle: dim_line / dim_route]
    F -->|Haltestellen| H[Tabelle: dim_ort]
    G --> I[API: /analytics/geometry/route/{id}]
    H --> I
    I -->|JSON Response| J[Frontend: GeometryMap.jsx]
    J --> K[Leaflet Map Rendering]
```

## Detaillierter Datenfluss

### 1. Datenimport & Anreicherung
*   **Schritt**: Import der VDV-Rohdaten (`import_vdv.py`).
*   **Ergebnis**: Roachdaten sind in `vdv_schedule.duckdb` verfügbar.
*   **Geometrie-Update**: Ein Skript (`etl_update_geometries.py`) lädt externe Koordinaten.
    *   **Problem**: Das Matching erfolgt über `HST_NR_NATIONAL` (Nummer) oder Kürzel. Wenn eine Haltestellen-Nummer mehrere physische Positionen (Steige) hat, gewinnt beim Update oft der letzte Eintrag oder der erste Match aus der CSV.

### 2. Datenbereitstellung (API)
*   **Schritt**: Die API (`backend/app/routers/analytics.py`) stellt die Routen-Geometrie bereit.
*   **Endpoint**: `GET /geometry/route/{line_id}`
*   **Logik**:
    1.  Wählt eine repräsentative Route (Variante) aus `dim_route`.
    2.  Holt alle Haltestellen dieser Route.
    3.  **Kritischer Punkt**: Joint mit `dim_ort` über `ideal_stop_nr` = `stop_abbr`.
    4.  **Aggregation**: Da `dim_ort` mehrere Einträge pro `stop_abbr` haben kann (z.B. Steig A, Steig B), führt die API eine Gruppierung durch:
        ```sql
        SELECT stop_abbr, MAX(lat), MAX(lon) ... GROUP BY stop_abbr
        ```
    *   **Folge**: Es wird *irgendeine* Koordinate für den Haltestellennamen gewählt (in diesem Fall die nördlichste/östlichste). Dies führt dazu, dass Hin- und Rückweg oft auf denselben Punkt "snappen", auch wenn die Haltestellen gegenüberliegen.

### 3. Frontend-Darstellung
*   **Schritt**: `GeometryMap.jsx` empfängt die Liste der Haltestellen.
*   **Rendering**:
    *   Zeichnet Marker an den empfangenen Koordinaten (die ggf. "falsch" aggregiert wurden).
    *   Zeichnet eine Linie (`Polyline`) direkt zwischen diesen Punkten.
    *   **Folge**: Die Linie springt wild hin und her, wenn die Reihenfolge der Haltestellen stimmt, aber die Koordinaten auf den falschen Steig "eingerastet" sind. Zudem folgt die Linie nicht dem Straßenverlauf, da keine Streckengeometrie (Shapefile/Trajektorie) vorliegt.

## Zusammenfassung der Fehlerursachen

1.  **Linien**: Werden als gerade Striche zwischen Haltestellen gezeichnet, da echte Pfad-Daten fehlen.
2.  **Varianten**: Die Darstellung ist korrekt für die *logische* Abfolge der Haltestellen, aber visuell falsch, wenn Koordinaten ungenau sind.
3.  **Haltestellen**: Durch die Aggregation (`MAX(lat)`) wird für jede Haltestelle nur genau eine Koordinate verwendet, anstatt für jede Fahrtrichtung/Variante den korrekten Steig auszuwählen.
