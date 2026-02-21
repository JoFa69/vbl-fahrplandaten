# Projekt: VDV 452 Analytics Platform (DuckDB + FastAPI + React)

## 1. Projektziel
Bereitstellung einer performanten Analytics-Plattform für VDV 452 Fahrplandaten.
Kernkomponenten sind eine **DuckDB-basierte Datenhaltung** (Data Warehouse), eine **FastAPI-Backend-Schicht** für Metriken und Drill-Through-Analysen, sowie ein **React-Frontend** zur Visualisierung.

## 2. Tech Stack & Umgebung
*   **Backend:** Python 3.x, FastAPI, Typer.
*   **Datenbank:** DuckDB (OLAP, File-based `20261231_fahrplandaten_2027.db`).
*   **Frontend:** React, Vite, CSS Modules (kein Tailwind/Bootstrap).
*   **Visualisierung:** Eigene CSS-basierte Charts (Zero-Dependency).

## 3. Daten-Pipeline (ELT-Status)
Der Import-Prozess ist abgeschlossen und operativ:
1.  **Rohdaten (.x10)** werden 1:1 in `stg_*` Tabellen geladen.
2.  **Transformation:** SQL-Views bereinigen Typen und verknüpfen Geometrien.
    *   `dim_ort`: Haltestellen mit WGS84 Koordinaten.
    *   `dim_line`: Linien-Definitionen.
    *   `dim_route`: Topologische Routen.
    *   `cub_schedule`: Faktentabelle aller Fahrten (explodiert auf Kalendertage).

## 4. API & Analytics Schicht
Das Backend (`backend/app/routers/analytics.py`, `data.py`) stellt REST-Endpunkte bereit für:
*   **Architektur (Thread-Safe):** Endpunkte sind als synchrone `def` Funktionen definiert, wodurch FastAPI diese in einen ThreadPool auslagert. Dies verhindert das Blockieren des Event-Loops durch synchrone DuckDB-Calls. Der Datenbankzugriff erfolgt über eine zentrale Read-Only-Verbindung, welche pro Request einen thread-lokalen Cursor liefert (`.cursor()`).
*   **`/volume`**: Fahrten-Volumen (Filter: Linie, Stunde, Richtung).
*   **`/geometry`**: Netz-Struktur (Linien -> Varianten -> Haltestellen, als Leaflet/Map Features).
*   **`/time`**: Fahrzeiten und Pünktlichkeit.
*   **`/infrastructure`**: Haltestellen-Belastung (Events/Stunde).
*   **`/stats` & `/raw-files`**: Anzeige der DuckDB Tabellenstatistiken und VDV Rohdaten (Daten-Manager).

## 5. Frontend Dashboard
Ein "VDV Analyse-Dashboard" (`AnalyticsDashboard.jsx`) bietet:
*   **Drill-Down UX:** Von der Gesamtübersicht (z.B. alle Linien) in Details (Stundenprofil einer Linie).
*   **High-Volume Charts:** Performante Balkendiagramme auch für große Datensätze (>50 Linien).
*   **Responsives Design:** Full-Width Layout für maximale Datendichte.

## 6. Daten-Besonderheiten
*   **Fahrplan-Explosion:** Die abstrakten VDV-Gültigkeiten wurden bereits in konkrete Fahrt-Instanzen (`cub_schedule`) umgerechnet.
*   **Geometrie:** Koordinaten liegen transformationsbereit vor.
