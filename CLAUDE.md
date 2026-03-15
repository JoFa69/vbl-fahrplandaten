# CLAUDE.md — VBL Fahrplandaten

Projektspezifische Anweisungen für Claude Code.

## Projekt-Überblick

VDV 452 Analytics-Plattform für VBL (Verkehrsbetriebe Luzern). Analysiert Fahrplandaten, Fahrzeugumläufe, Garagierung und Betriebsmetriken via interaktives Web-Dashboard.

Zwei Szenarien:
- **Strategie 2027** (default): Planungsdaten für zukünftige Netzgestaltung
- **Operativer Ist-Plan**: Echtbetrieb-Daten (in Vorbereitung)

## Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | Python + FastAPI + Uvicorn (Port 8000) |
| Datenbank | DuckDB (OLAP, file-based) |
| Frontend | React 19 + Vite (Port 3001 / 5173 dev) |
| Styling | Tailwind CSS + CSS Modules |
| Charts | Recharts, ECharts, D3, Tremor |
| Karte | Leaflet + React-Leaflet |
| Tabellen | TanStack React Table |

## Projekt starten

```bash
# Windows (empfohlen)
start.bat

# Manuell
# Terminal 1:
cd backend && python -m uvicorn app.main:app --reload --port 8000
# Terminal 2:
cd frontend && npm run dev
```

URLs: Frontend http://localhost:3001 | API http://localhost:8000 | Docs http://localhost:8000/docs

## Wichtige Dateipfade

```
backend/app/
├── main.py          # FastAPI Setup, CORS, Router-Includes
├── database.py      # DuckDB Connection Pool (thread-safe)
└── routers/
    ├── analytics.py # /volume, /geometry, /time, /infrastructure
    ├── data.py      # /stats, /raw-files
    ├── umlaeufe.py  # Fahrzeugumläufe & Garagierung
    └── ai.py        # KI-Endpunkte

frontend/src/
├── App.jsx          # Routing
├── api.js           # Axios-Client
├── components/      # Wiederverwendbare UI-Komponenten
└── pages/           # Seitenkomponenten (eine pro Route)
```

## Datenbankschema (Star Schema)

- **Fact:** `cub_schedule` — alle Fahrten auf konkrete Kalendertage explodiert
- **Dim:** `dim_line`, `dim_ort` (Haltestellen mit WGS84), `dim_route`

Datenbanken:
- `20261231_fahrplandaten_2027.db` — Strategie-Szenario (primär)
- `operative_transformed.db` — Operatives Szenario

## Code-Regeln

### JSX / HTML (Antigravity-Kompatibilität)
Siehe [AGENTS.md](AGENTS.md) für vollständige Regeln. Kurzfassung:
- Keine Fragments `<>...</>` für editierbare Elemente
- Key-Sections mit `id` oder `className` versehen
- Inline-Styles als `style={{ camelCase: 'value' }}`

### Backend
- DuckDB-Verbindungen sind **thread-local** und read-only — nie neue Verbindungslogik außerhalb von `database.py` einführen
- Szenario-Switching läuft über Query-Parameter `scenario=strategic|operative`
- Keine synchronen Blocking-Calls in FastAPI-Route-Handlers

### Allgemein
- Keine neuen Dateien anlegen, wenn eine bestehende erweitert werden kann
- Keine Over-Engineering — minimale Lösung für den konkreten Bedarf
- Deutsch ist die Projektsprache für Kommentare und Commits

## Kontext-Dokumente

- [CONTEXT.md](CONTEXT.md) — Fachlicher Hintergrund & Datenmodell
- [Szenarien_Erklaerung.md](Szenarien_Erklaerung.md) — Szenario-Logik im Detail
- [project_status.md](project_status.md) — Aktueller Projektstatus
- [docs/](docs/) — Weitere Dokumentation
