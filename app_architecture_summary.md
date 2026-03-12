# VBL Fahrplandaten — App-Architektur Zusammenfassung

> Referenz für den Aufbau der neuen **E-Bus Stromverbrauch** Web-App, gegliedert in **Technische** und **Grafische** Komponenten.

---

## 1. Technische Komponenten

### 1.1 Projektstruktur

```
Projekt-Root/
├── backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI App + CORS + Router-Registrierung
│   │   ├── database.py      # DuckDB-Verbindung (Singleton, Szenarien)
│   │   └── routers/         # Endpunkt-Module
│   │       ├── data.py      # CRUD / Tabellen / Stats
│   │       ├── analytics.py # Analytische Endpunkte  
│   │       ├── ai.py        # LLM/KI-Integration (Google GenAI)
│   │       └── umlaeufe.py  # Umlauf-spezifische Endpunkte
│   ├── requirements.txt
│   └── .env                 # API-Keys (z.B. GOOGLE_API_KEY)
├── frontend/                # React (Vite) Frontend
│   ├── index.html           # Entry-Point mit Google Fonts
│   ├── vite.config.js       # Dev-Server + Proxy-Konfiguration
│   ├── postcss.config.js    # TailwindCSS v4 PostCSS Plugin
│   ├── package.json         # Abhängigkeiten
│   └── src/
│       ├── main.jsx         # React-Root (StrictMode)
│       ├── App.jsx           # Router-Definition (alle Routen)
│       ├── index.css         # Design-System (Theme-Tokens)
│       ├── api.js            # Zentraler API-Layer
│       ├── hooks/            # Custom React Hooks
│       ├── components/       # Wiederverwendbare UI-Komponenten
│       └── pages/            # Seiten-Komponenten
├── start.bat                 # Windows-Startscript (Backend + Frontend)
└── *.db                      # DuckDB-Datenbanken
```

---

### 1.2 Tech Stack

| Schicht | Technologie | Version | Zweck |
|---|---|---|---|
| **Build-Tool** | Vite | 7.x | Dev-Server + HMR + Build |
| **Frontend** | React | 19.x | UI-Framework |
| **Routing** | react-router-dom | 7.x | Client-seitiges Routing |
| **Styling** | TailwindCSS | 4.x | Utility-CSS via PostCSS |
| **Charts** | Recharts | 3.x | Deklarative React-Charts |
| **Charts (Low-Level)** | D3.js | 7.x | Bild-Fahrplan, Custom-SVG |
| **Karten** | Leaflet + react-leaflet | 1.9 / 5.0 | Geo-Visualisierung |
| **Tabellen** | @tanstack/react-table | 8.x | Sortierbare Datentabellen |
| **Icons** | Google Material Symbols | — | Outlined-Icons via CDN |
| **Icons (extra)** | lucide-react | 0.5x | Zusätzliche SVG-Icons |
| **HTTP-Client** | Native `fetch` (via `api.js`) | — | Kein Axios für API-Calls |
| **Backend** | FastAPI (Python) | latest | REST-API |
| **Datenbank** | DuckDB | latest | OLAP, file-basiert |
| **Daten** | Pandas | latest | Daten-Transformation |
| **AI** | google-genai | latest | LLM-Anfragen |

---

### 1.3 Backend-Architektur (FastAPI + DuckDB)

#### `main.py` — App Setup
```python
app = FastAPI(title="VDV Schedule API")
app.add_middleware(CORSMiddleware, allow_origins=[...])
app.include_router(data.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
```

**Pattern zu übernehmen:**
- CORS erlaubt `localhost:3001` (Vite) und `localhost:5173`
- Alle Router unter `/api` Prefix
- Getrennte Router-Module nach Domäne

#### `database.py` — DuckDB Singleton
```python
class Database:
    _instances = {}  # Singleton pro Szenario

    @classmethod
    def get_connection(cls, scenario="strategic"):
        if scenario not in cls._instances:
            cls._instances[scenario] = duckdb.connect(db_path, read_only=True)
        return cls._instances[scenario].cursor()  # Thread-lokaler Cursor

def get_db(scenario="strategic"):
    return Database.get_connection(scenario)
```

**Pattern zu übernehmen:**
- Read-Only Zugriff via `.cursor()` (thread-safe)
- Szenario-Umschaltung über Header `x-scenario`
- DuckDB-Dateien im Projekt-Root

#### Router-Pattern (`data.py`, `analytics.py`)
```python
router = APIRouter()

@router.get("/analytics/volume")
def get_volume(line_no: str = None, request: Request = None):
    scenario = request.headers.get("x-scenario", "strategic")
    conn = get_db(scenario)
    result = conn.execute("SELECT ...").fetchdf()
    return result.to_dict(orient="records")
```

**Pattern zu übernehmen:**
- `def` (nicht `async def`) → FastAPI lagert in ThreadPool aus
- Szenario aus Header lesen
- DuckDB-SQL → Pandas DataFrame → JSON via `to_dict(orient="records")`

---

### 1.4 Frontend-Architektur

#### `api.js` — Zentraler API-Layer
```javascript
const API_BASE = "/api";

async function apiFetch(url, options = {}) {
    const currentScenario = localStorage.getItem("vbl_scenario") || "strategic";
    const headers = { ...options.headers, "x-scenario": currentScenario };
    return fetch(url, { ...options, headers });
}

export async function fetchSomeData(param) {
    const res = await apiFetch(`${API_BASE}/endpoint?param=${param}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
}
```

**Pattern zu übernehmen:**
- Zentrale `apiFetch()`-Funktion mit automatischem Header-Injection
- Jede API-Funktion separat exportiert
- URL-Parameter über `URLSearchParams`

#### `App.jsx` — Routing
```jsx
<Router>
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/seite1" element={<Seite1Page />} />
      ...
    </Route>
  </Routes>
</Router>
```

**Pattern zu übernehmen:**
- `AppShell` als Layout-Wrapper mit `<Outlet />`
- Flache Route-Struktur (kein verschachteltes Routing)

#### `useLocalStorage` Hook
```javascript
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });
    useEffect(() => { localStorage.setItem(key, JSON.stringify(storedValue)); }, [key, storedValue]);
    return [storedValue, setStoredValue];
}
```

---

### 1.5 Vite-Konfiguration

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

**Pattern zu übernehmen:**
- Frontend auf Port **3001**, Backend auf Port **8000**
- Proxy `/api` → Backend (keine CORS-Probleme im Dev)

---

### 1.6 Startup (`start.bat`)

Automatischer Start beider Server mit Health-Check:
1. Kill alter Prozesse
2. Backend starten (`uvicorn app.main:app --reload --port 8000`)
3. Warten bis Backend erreichbar (max 15s)
4. Frontend starten (`npm run dev`)

---

### 1.7 Abhängigkeiten (zum Kopieren)

#### `requirements.txt` (Backend)
```
fastapi
uvicorn
duckdb
pandas
pydantic
python-dotenv
```

#### `package.json` Dependencies (Frontend)
```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "axios": "^1.13.5",
    "d3": "^7.9.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.563.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.13.0",
    "recharts": "^3.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.24",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.3.1"
  }
}
```

---

## 2. Grafische Komponenten

### 2.1 Design-System (`index.css`)

Das gesamte Design basiert auf einem **dunklen Farbschema** mit TailwindCSS v4 `@theme`-Tokens:

```css
@import "tailwindcss";

@theme {
  /* Primary */
  --color-primary: #135bec;
  --color-primary-dark: #0b43b3;

  /* Backgrounds */
  --color-bg-dark: #101622;
  --color-surface-dark: #1c2433;
  --color-surface-lighter: #283042;
  --color-card-dark: #1a2230;

  /* Borders */
  --color-border-dark: #2d3748;

  /* Text */
  --color-text-muted: #9da6b9;
  --color-text-dim: #565f73;

  /* Semantic */
  --color-success: #0bda5e;
  --color-danger: #fa6238;
  --color-warning: #fbbf24;

  /* Accents */
  --color-accent-teal: #2dd4bf;
  --color-accent-purple: #a855f7;

  /* Slate scale (full) */
  --color-slate-900 bis --color-slate-100
}
```

**Nutzung im Code:**
- `bg-bg-dark`, `bg-surface-dark`, `bg-card-dark` → Hintergründe
- `text-text-muted`, `text-text-dim` → Sekundärtext
- `border-border-dark` → Trennlinien
- `text-primary`, `bg-primary/15` → Akzente

---

### 2.2 Typografie & Fonts

Geladen in `index.html` via Google Fonts CDN:

| Font | Verwendung |
|---|---|
| **Inter** (300–800) | Hauptschrift für alle Texte |
| **Material Symbols Outlined** | Icon-Font für Navigation & UI |

```css
body {
  font-family: 'Inter', ui-sans-serif, system-ui, ...;
}

html {
  font-size: 18px;  /* Skaliert alles für 4K-Readability */
}
```

---

### 2.3 Utility-Klassen (Custom CSS)

```css
/* Dark-Mode Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--color-bg-dark); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border-dark); border-radius: 3px; }

/* Glassmorphism Panel */
.glass-panel {
  background: rgba(30, 41, 59, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Grid-Hintergrund für Karten */
.map-bg {
  background-image: linear-gradient(...), linear-gradient(90deg, ...);
  background-size: 40px 40px;
}
```

---

### 2.4 App-Shell Layout

```
┌─────────────────────────────────────────────┐
│ Sidebar (w-64)  │  HeaderBar (h-16)         │
│ ─────────────── │  ────────────────────────  │
│ Brand-Logo      │  Breadcrumb / Page Title   │
│ Nav-Items       │  Szenario-Switcher         │
│ (Material Icons)│                            │
│                 │ ──────────────────────────  │
│                 │  <Outlet />                │
│                 │  (Page Content, scrollbar)  │
│                 │                            │
│ ────────────────│                            │
│ Einstellungen   │                            │
└─────────────────────────────────────────────┘
```

#### Sidebar (`Sidebar.jsx`)
- Dunkelster Hintergrund: `bg-[#111318]`
- Brand-Bereich: Icon-Badge (`bg-primary`) + Titel + Subtitle
- Nav-Items: `NavLink` mit Material-Symbol-Icon + Label
- Aktiver Link: `bg-primary/15` + blaue Akzentleiste links (`w-1 h-5 bg-primary rounded-r-full`)
- Hover: `hover:bg-slate-800 hover:text-white`
- Trenner vor "Einstellungen"

#### HeaderBar (`HeaderBar.jsx`)
- Semi-transparent: `bg-[#111318]/95 backdrop-blur`
- Breadcrumb-Navigation (optional), Page-Title
- Szenario-Switcher (Toggle-Buttons `bg-primary/bg-amber-500`)
- Badge für aktives Szenario (z.B. „Strategische Planung" in amber)

---

### 2.5 Chart-Bibliothek & Visualisierungen

| Komponente | Bibliothek | Typ |
|---|---|---|
| `UmlaufAreaChart` | Recharts | Flächen-Diagramm |
| `UmlaufDonut` | Recharts | Donut/Pie-Chart |
| `UmlaufHistogram` | Recharts | Balken-Histogramm |
| `UmlaufScatterPlot` | Recharts | Streudiagramm |
| `FrequencyChart` | Recharts | Frequenz-Balkendiagramm |
| `HeadwayChart` | Recharts | Taktzeit-Visualisierung |
| `BoxplotChart` | Recharts | Boxplot-Diagramm |
| `DeviationChart` | Recharts | Abweichungs-Diagramm |
| `HeatmapTimeline` | D3.js (Custom SVG) | Fahrplan-Heatmap |
| `MatrixChart` | D3.js (Custom SVG) | Matrix-Darstellung |
| `BildfahrplanChart` | D3.js (Custom SVG) | Weg-Zeit-Diagramm |
| `GanttChartComponent` | D3.js (Custom SVG) | Gantt-Diagramm |
| `TreeMapComponent` | D3.js (Custom SVG) | Treemap |
| `ScatterPlotComponent` | D3.js (Custom SVG) | Streudiagramm |
| `MapComponent` | Leaflet | Geo-Karte |
| `GeometryMap` | Leaflet | Netz-Geometrie-Karte |
| `NetworkMap` | Leaflet | Topologie-Netzplan |

**Recharts-Pattern (für Standardcharts):**
```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="name" stroke="#9da6b9" />
    <YAxis stroke="#9da6b9" />
    <Tooltip contentStyle={{ background: '#1c2433', border: '1px solid #2d3748' }} />
    <Bar dataKey="value" fill="#135bec" radius={[4,4,0,0]} />
  </BarChart>
</ResponsiveContainer>
```

**D3-Pattern (für Custom-Charts):**
- SVG-Referenz via `useRef`
- Zeichnung in `useEffect` mit D3 `select`, `scale`, `axis`
- Dark-Mode Achsen/Labels mit `stroke: #9da6b9`

---

### 2.6 Karten (Leaflet)

```jsx
<MapContainer center={[47.05, 8.3]} zoom={13}
  style={{ height: '100%', background: '#101622' }}>
  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
  {routes.map(r => <Polyline positions={r.coords} pathOptions={{ color: r.color, weight: 3 }} />)}
  {stops.map(s => <CircleMarker center={[s.lat, s.lon]} radius={5} 
    pathOptions={{ fillColor: '#333', stroke: true }} />)}
</MapContainer>
```

**Pattern zu übernehmen:**
- Dunkle Basemap: CartoDB Dark Matter
- `CircleMarker` für Haltestellen (dunkelgrau)
- `Polyline` für Routen (farbig pro Linie)

---

### 2.7 Seiten-Layout Patterns

Typische Seiten verwenden folgende Muster:

**Pattern 1: Volle Breite mit Filter-Header**
```jsx
<div className="p-6 space-y-6">
  {/* Filter-Bar */}
  <div className="flex items-center gap-4">
    <FilterTabs /> <Select /> <Button />
  </div>
  {/* Content */}
  <div className="grid grid-cols-2 gap-6">
    <ChartCard title="..." />
    <ChartCard title="..." />
  </div>
</div>
```

**Pattern 2: Split-Layout (Map + Details)**
```jsx
<div className="flex h-full">
  <div className="w-3/5"><MapComponent /></div>
  <div className="w-2/5 overflow-y-auto space-y-4 p-4">
    <MetricCard /> <ChartCard />
  </div>
</div>
```

**Card-Pattern:**
```jsx
<div className="bg-card-dark rounded-xl border border-border-dark p-5">
  <h3 className="text-sm font-semibold text-slate-300 mb-4">Titel</h3>
  {/* Content */}
</div>
```

---

### 2.8 UI-Elemente & Micro-Patterns

| Element | Styling |
|---|---|
| **Cards** | `bg-card-dark rounded-xl border border-border-dark p-5` |
| **Filter-Tabs** | Inline-Buttons, aktiv: `bg-primary text-white`, inaktiv: `text-slate-400 hover:text-slate-200` |
| **Badges** | `px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase` |
| **Tooltips** | `bg-surface-dark border-border-dark` mit weissem Text |
| **Progress-Bars** | `h-1.5 rounded-full bg-primary` auf `bg-slate-700` Track |
| **Trennlinien** | `border-t border-border-dark/50` |
| **Aktiver Nav-Link** | Linker Akzent-Strip `w-1 h-5 bg-primary rounded-r-full` |

---

### 2.9 Zusammenfassung der visuellen Identität

| Eigenschaft | Wert |
|---|---|
| **Modus** | Ausschliesslich Dark Mode |
| **Primärfarbe** | `#135bec` (kräftiges Blau) |
| **Hintergrund** | `#101622` (tiefes Navy-Dunkel) |
| **Karten** | `#1c2433` (leicht heller) |
| **Text primär** | `#f1f5f9` (fast Weiss) |
| **Text sekundär** | `#9da6b9` (gedämpftes Grau-Blau) |
| **Schriftart** | Inter (Google Fonts) |
| **Icons** | Material Symbols Outlined |
| **Glassmorphism** | `glass-panel` Klasse verfügbar |
| **Rundungen** | `rounded-xl` für Karten, `rounded-lg` für Buttons |
| **Schatten** | Sparsam, primär `shadow-lg shadow-primary/20` auf Brand-Icon |
