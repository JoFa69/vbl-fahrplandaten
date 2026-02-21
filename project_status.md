# Project Status & Architecture Overview

**Stand:** Februar 2026

Dieses Dokument beschreibt den aktuellen technischen Status der VDV Analytics Plattform.

## 1. System Architektur

Das System folgt einer 3-Schicht-Architektur:

### A. Data Layer (DuckDB)
*   **File:** `20261231_fahrplandaten_2027.db`
*   **Schema (Star Schema Ansatz):**
    *   **Fact:** `cub_schedule` (Jede Fahrt, aufgelöst auf Kalendertag und Startzeit).
    *   **Dimensions:**
        *   `dim_line` (Liniennummern, Texte).
        *   `dim_ort` (Haltestellen, Geokoordinaten).
        *   `dim_route` (Varianten/Routen-Verlauf).
*   **Performance:** Spalten-basierte Speicherung ermöglicht Aggregationen über Millionen von Fahrten in Millisekunden.

### B. Backend Layer (FastAPI)
*   **Technologie:** Python 3.11+, FastAPI.
*   **Pfad:** `backend/app/`
*   **Rolle:** Dient als API-Gateway zur DuckDB.
*   **Wichtige Module:**
    *   `database.py`: DuckDB Connection Pooling.
    *   `routers/analytics.py`: Enthält die Business-Logik für Metriken (SQL Queries, Drill-Down Logik).

### C. Frontend Layer (React)
*   **Technologie:** React 18, Vite.
*   **Pfad:** `frontend/src/`
*   **Styling:** Pure CSS (CSS Modules), kein Framework-Overhead.
*   **Komponenten:**
    *   `AnalyticsDashboard.jsx`: Container für die Analyse-Tabs.
    *   `VolumeMetrics.jsx`: Balkendiagramm für Fahrten-Volumen.
    *   `TimeMetrics.jsx`, `InfrastructureMetrics.jsx`, `GeometryMetrics.jsx`: Weitere Fach-Ansichten.

## 2. Feature Status

### Implementierte Analytics-Funktionen
| Feature | Beschreibung | Status |
| :--- | :--- | :--- |
| **Fahrten-Volumen** | Analyse der Fahrtenanzahl pro Linie. Drill-Down auf Stunden und Richtungen. | ✅ Live |
| **Netz-Geometrie** | Auflistung aller Linien, Varianten und Haltestellenfolgen inkl. Koordinaten. | ✅ Live |
| **Karte & Perlschnur** | Interaktive Map-Darstellung (Leaflet) synchronisiert mit Resizable-Panels und Perlschnur für Routen. | ✅ Live |
| **Zeit-Analyse** | Durchschnittliche Fahrtdauern pro Linie und Variante (Pünktlichkeits-Potential). | ✅ Live |
| **Infrastruktur** | Heatmap der Haltestellen-Belastung (Abfahrten pro Stunde). | ✅ Live |
| **Daten-Manager** | Übersicht über extrahierte VDV-Rohdateien und DuckDB-Tabellen-Metriken (Thread-safe API). | ✅ Live |

### UI/UX Konzept
*   **Full-Width:** Nutzung der gesamten Bildschirmbreite für maximale Datendichte.
*   **Drill-Down:** Interaktive Filterung (Klick auf Linie -> Filtert Dashboard auf diese Linie).
*   **High-Contrast:** Optimiert für Lesbarkeit (Dunkle Schrift auf hellem Grund).
*   **Scrollable Charts:** Automatische Skalierung bei großen Datensätzen (z.B. >50 Linien).
*   **Resizable Panels:** Dynamische Aufteilung zwischen Karten- und Detailansichten (z.B. Perlschnur).

## 3. Offene Punkte / Next Steps
*   [ ] **Echtzeit:** Integration von VDV 453/454 Echtzeit-Daten (Soll vs. Ist Vergleich).
*   [ ] **Export:** CSV/Excel Export der angezeigten Tabellen.
