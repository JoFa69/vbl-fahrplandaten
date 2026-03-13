# Lastenheft & Funktionale Dokumentation: VBL Fahrplandaten App

Dieses Dokument bietet eine vollständige Übersicht über die Funktionalitäten, Ansichten und Datenflüsse der **VBL Fahrplandaten** Web-Applikation (Frontend). Es dient als Referenz und "Lastenheft" für bestehende und zukünftige Entwicklungen.

## 1. Übersicht & Struktur der App

Die Applikation gliedert sich in verschiedene Fachbereiche, die über das Navigationsmenü (AppShell) aufgerufen werden können:
- **Daten-Management**: Import und Struktur der VDV-452 Rohdaten.
- **Netz-Geometrie & Plan**: Analyse der Streckennetz-Dimension und abstrakte Knoten/Kanten-Abbildung.
- **Netz-Auslastung**: Heatmaps und Streckenbelastung.
- **Fahrplan & Frequenzen**: Auswertung von Takten und Fahrtenhäufigkeiten.
- **Haltestellen**: Infrastruktur und Gewichtung im Netz.
- **Umsteigebeziehungen & Korridore**: Detaillierte Perlschnur- und Taktqualitäts-Analysen auf spezifischen Streckenabschnitten.
- **Umläufe & Garagierung**: Analyse der Fahrzeugeinsätze, Effizienz und Depot-Auslastung.
- **Fahrplan-Vergleich**: Delta-Vergleich zweier Fahrplanperioden.

---

## 2. Detailbeschreibung der Unterseiten

### 2.1 Daten-Manager (`/`, `/daten`)
- **Zweck**: Übersicht über den Import-Status, die Rohdaten (VDV 452) und die Datenbank-Tabellen (DuckDB).
- **Darstellung**:
  - **KPI-Karten**: Linien Gesamt, Aktive Fahrten, Haltepunkte, VDV Dateien.
  - **Tab-Ansichten**:
    1. **DB-Tabellen**: Tabelle aller aktiven/leeren Datenbank-Tabellen (Spaltenanzahl, Zeilen, Typ) mit Detail-Inspektor-Modal zur Anzeige flacher Daten (`fetchTableData`).
    2. **VDV 452 Rohdaten**: Liste der `.x10` Files (Größe, Zeilen) mit Preview-Modal (`fetchRawFilePreview`).
    3. **Zuordnung (Mapping)**: Visuelle Pipeline-Darstellung (welche x10-Datei füllt welche DB-Tabelle via `import_vdv.py`).
- **Datenquellen**: `fetchAnalyticsStats`, `fetchStats`, `fetchAllStops`, `fetchRawFiles`.
- **Datenaufbereitung**: Mapping ist hart im Frontend (`VDV_DB_MAPPING`) codiert. Daten werden paginate (50er Blöcke) vom Backend geliefert.
- **Filter**: Tab-Wechsel (DB / Raw / Mapping).

### 2.2 Netz-Geometrie (`/netz`)
- **Zweck**: Analyse der Linienwege, Varianten und Haltestellenabfolgen (Perlschnur) gekoppelt mit einer Kartendarstellung.
- **Darstellung**:
  - **Geteilter Bildschirm** (horizontal und vertikal resizable).
  - **Links**: TanStack-Tabelle (sortier- & filterbar) — zuerst Linienübersicht, beim Klick Drill-down auf Linienvarianten (inkl. Richtung / Route).
  - **Rechts Oben**: `GeometryMap` (Geografische Darstellung der ausgewählten Linie / Variante).
  - **Rechts Unten**: Matrix-Darstellung ("Perlschnur") aller Varianten einer Linie (Punkte = angefahrene Haltestellen).
- **Datenquellen**: `fetchGeometryMetrics`, `fetchPrimaryRoutes`, `fetchRouteGeometry`, `fetchLineVariants`.
- **Datenaufbereitung**: Varianten werden basierend auf tatsächlichem Linienverlauf in Matrix-Spalten abgebildet.
- **Filter**: Fahrtart (Alle, Linien, Leer, Position.), Matrix-Richtung (Hin/Rückfahrt), Spaltenfilter (TanStack).

### 2.3 Netzplan Visualisierung (`/netz/plan`)
- **Zweck**: Abstrakte Darstellung des Netzes (Grafen-Theorie: Knoten und Kanten) für Topologie-Analysen.
- **Darstellung**:
  - Graph/Netzwerk-Ansicht (`NetworkMap`) für das gesamte Netz.
  - Overlay mit Knoten- und Kanten-Anzahl.
- **Datenquellen**: `fetchNetworkNodes`, `fetchTimetableTagesarten`.
- **Datenaufbereitung**: Backend berechnet aus Haltestellen (Knoten) und Fahrtabschnitten (Kanten) eine Netzwerkstruktur für das gewählte Zeitfenster.
- **Filter**: Tagesart (Mo-Fr usw.), Zeitfenster (z.B. Morgen-HVZ, Abend-HVZ), Richtung (Beide/Hin/Rück).

### 2.4 Netz-Auslastung (`/netz/auslastung`)
- **Zweck**: Darstellung von Belastung (km/h) und Frequenz (Fahrtenvolumen) auf den Netz-Segmenten.
- **Darstellung**:
  - Vollbild-Karte (`GeometryMap`).
  - Schwebendes Legenden-Panel (Geschwindigkeit = Farbe, Volumen = Dichte/Dicke).
  - Abspielbarer Zeitstrahl (04:00 - 24:00) unten.
- **Datenquellen**: `fetchPrimaryRoutes` (weitere Live-Daten scheinen noch statisch oder im Ausbau zu sein).
- **Datenaufbereitung**: Segmente werden aufgrund ihrer Belastung zur gewählten Uhrzeit eingefärbt (Geplante Reisezeit vs. Distanz = km/h).
- **Filter**: Linienbündel (Alle/Bus/Tram), Tagestyp (Mo-Fr/Sa/So), Richtung, Zeit-Slider, Ansichts-Toggle (Load vs. Details). *(Hinweis: Bestimmte Filter teils noch als Mock/Statisch im UI).*

### 2.5 Fahrplan & Frequenz (`/fahrplan`)
- **Zweck**: Detaillierte Betrachtung des Taktschemas einer einzelnen Linie.
- **Darstellung**:
  - **KPIs**: Fahrten Gesamt, Betriebszeitraum, Richtungssymmetrie, Spitzenfrequenz.
  - **Takt-Matrix (Heatmap)**: Scatter-Chart (Y: Richtung, X: Stunde), Farbe/Größe zeigt Fahrtenanzahl.
  - **Linienweg-Varianten (Donut)**: Anteile der gefahrenen Varianten am Gesamtvolumen dieser Linie.
  - **Takt-Treuendiagramm (BarChart)**: Verteilung der Taktzeiten (z.B. Wie oft exakt 10 Min., 12 Min. usw. Abstand).
- **Datenquellen**: `fetchLines`, `fetchVolumeMetrics`, `fetchTimetableHeatmap`, `fetchTimetableHeadway`, `fetchTimetableKPIs`.
- **Datenaufbereitung**: Komplexe SQL-Zeitfenster (Window-Functions) im Backend zur Berechnung der Headways (Abstand zwischen zwei Fahrzeugen derselben Linie am selben Ort).
- **Filter**: Linien-Auswahl, Tagesart (Mo-Fr, Sa, ...), Richtung (Beide/1/2).

### 2.6 Haltestellen Infrastruktur (`/haltestellen`)
- **Zweck**: Verzeichnis aller Haltestellen und deren "Wichtigkeit" (Bedingt durch tägliche Frequenz).
- **Darstellung**:
  - Detail-Tabelle (ID, Name, Frequenz als In-Cell Balkendiagramm, Linienanzahl).
  - Slide-Over-Detailpanel (rechts) beim Klick: Koordinaten, Barrierefreiheit (aktuell teils Mock), Tages-Metriken.
- **Datenquellen**: `fetchAllStops` (mit kalkulierten Frequenzen).
- **Datenaufbereitung**: Frontend berechnet den maximalen Frequenz-Wert zur Skalierung der relativen Balken in der Tabelle.
- **Filter**: Text-Suche (Name/ID).

### 2.7 Haltestellen Charts (`/haltestellen/charts`)
- **Zweck**: Visuelle Identifikation von Netzknoten und wichtigen Hubs.
- **Darstellung** (60/40 Layout):
  - **MapComponent (Bubble Map)**: Haltestellen auf der Karte (Blasen-Größe = Frequenz).
  - **ScatterPlot**: Korrelation: x-Achse Linienanzahl vs. y-Achse Frequenz (Ausreißer-Analyse).
  - **TreeMap**: Rechteck-Fläche = Frequenz, Farbe = Anzahl der kreuzenden Linien.
- **Datenquellen**: `fetchAllStops`.
- **Datenaufbereitung**: Direktes Plotting der aggregierten Werte.
- **Filter**: Tagesart-Tabs (Alle, Mo-Fr...).

### 2.8 Korridor- & Haltestellen-Analyse (`/korridor`)
- **Zweck**: Experten-Werkzeug für tiefgreifende Analysen von Streckenabschnitten und Umsteigeknoten.
- **Darstellung** (Aufgeteilt in 3 Sektionen/Tabs):
  - **Sektion A (Strecke)**: Weg-Zeit/Bildfahrplan-Diagramm (`BildfahrplanChart`) zwischen Haltestelle A und B.
  - **Sektion B (Angebot)**: Summiertes Angebot (Gestapeltes Balkendiagramm - `FrequencyChart`) & Abfahrtsminuten-Matrix (`MatrixChart`, Taktraster für Lücken-Erkennung).
  - **Sektion C (Takt-Qualität)**: `HeatmapTimeline`, `HeadwayChart` (Takt-Trend), `BoxplotChart` (Schwankungsbreite der Takte), `DeviationChart` (Pulk/Lücken-Abweichung vom Soll-Takt).
- **Datenquellen**: Vielfältig (über Child-Components z.B. für Bildfahrplan-Daten, Headways). Basis-Listen: `fetchAllStops`, `fetchTimetableTagesarten`.
- **Datenaufbereitung**: Sehr hohe Dichte an aggregierten Daten (Minutenabstände, gleitende Durchschnitte, Boxplot-Quartile).
- **Filter**: 
  - *Global*: Tagesart, Richtung, Ein-/Aussetzer (Checkbox), auszublendende Linien.
  - *Sektionsspezifisch*: Start/Ziel, Zeitfenster (From/To) in A; Knotenpunkt in B/C; Soll-Takt & Toleranz-Korridor in C.

### 2.9 Umlauf-Übersicht (`/umlaeufe`)
- **Zweck**: Liste und Basis-Metriken der geplanten Fahrzeug-Produktionen (Umläufe).
- **Darstellung**:
  - **KPIs**: Aktive Umläufe, Ø Dauer, Gesamt-Fahrten, Gesamtdistanz.
  - **Datentabelle**: Umlauf ID, Fahrten-Anzahl, Erste Abfahrt (Start), Letzte Ankunft (Ende), Dauer, Distanz.
- **Datenquellen**: `api/umlaeufe/summary`, `api/umlaeufe` (List endpoint).
- **Datenaufbereitung**: Backend summiert Fahrten je `umlauf_id`.
- **Filter**: Tagesart-Tabs.

### 2.10 Umlauf-Charts (`/umlaeufe/charts`)
- **Zweck**: Dashboard zur Umlauf-Effizienz und Fahrzeug-Auslastung.
- **Darstellung**:
  - **Fahrzeug-Auslastung (AreaChart)**: Zeigt "Peak Vehicles" und den Kurvenverlauf über den Tag.
  - **Verteilung Dauer (Histogramm)**: Wie viele Umläufe dauern z.B. 4-5h, 5-6h etc.
  - **Effizienz (Donut)**: Fahrbetrieb vs. Stand-/Wendezeit.
  - **Scatter-Plot**: Distanz vs. Einzel-Fahrten je Umlauf.
  - **Gantt-Diagramm**: Zeitbalken für jeden Umlauf (farbliche Abschnitte = Fahrten, grau = Standzeit).
- **Datenquellen**: `api/umlaeufe/gantt`, `api/umlaeufe/active_vehicles`, `api/umlaeufe/charts_stats`.
- **Datenaufbereitung**: Frontend-Berechnung der Histogamm-Bins und Abzug der Produktiven Zeit von der totalen Block-Dauer für den Effizienz-Donut.
- **Filter**: Tagesart-Tabs.

### 2.11 Garagierung & Depots (`/garagen`)
- **Zweck**: Zu- und Abfluss-Analyse der Busdepots.
- **Darstellung**:
  - **Summary**: Ranking Ausfahrten/Einfahrten pro Depot. Peak Vehicles (max. Fahrzeuge Typ auf der Strecke).
  - **Detail-Listen**: Getrennte Tabellen für detaillierte Ausfahrten und Einfahrten (Zeit, Umlauf, Linie, Depot, Fahrzeugtyp).
- **Datenquellen**: `fetchGaragingData`.
- **Datenaufbereitung**: Auswertung der Ersten und Letzten Fahrt eines Umlaufs zur Bestimmung von Ausfahrt/Einfahrt.
- **Filter**: Tagesart-Tabs (Mo-Do, Fr, Sa, So/Ft).

### 2.12 Fahrplan-Vergleich (`/vergleich`)
- **Zweck**: Darstellung der Änderungen (Deltas) zwischen zwei Datenständen (z.B. FP2024 vs. FP2025).
- **Darstellung**:
  - **KPI-Vergleich**: Baseline vs. Target mit absoluten und prozentualen Deltas.
  - **Listen**: "Hinzugefügte Leistung" und "Eingestellt/Reduziert".
- **Datenquellen**: Aktuell **vollständig Mock-Daten** im Frontend (`mockKpis`, `mockAdded`, `mockRemoved`).
- **Filter**: Basis-Fahrplan (Dropdown), Ziel-Fahrplan (Dropdown).

---

## 3. Vorschläge zur Pflege dieser Dokumentation

Damit das Lastenheft/Dokumentation nicht veraltet, wenn neue Features entwickelt oder Code umgebaut wird, empfehle ich eine der folgenden Vorgehensweisen:

### 3.1 Docusaurus oder MkDocs (Empfohlen für Skalierung)
Falls geplant ist, die Plattform in Zukunft zu stark erweitern und ggf. auch Benutzerdokumentation (Handbücher) anzubieten:
- Einführung von [Docusaurus](https://docusaurus.io/) oder [MkDocs](https://www.mkdocs.org/) (mit Material Theme).
- Damit kann in einem Ordner `docs/` in Markdown geschrieben werden und parallel zum Frontend eine schöne Dokumentations-Website gebuildet werden.

### 3.2 "Living Documentation" via Markdown im Repository (Lean-Ansatz)
- Dieses gesammelte Wissen sollte z.B. unter `docs/architecture.md` oder `docs/features.md` direkt ins Git-Repository aufgenommen werden.
- **Definition of Done (DoD)**: In den Entwicklungs-Richtlinien verankern, dass bei jedem Pull-Request / Feature-Abschluss das Markdown-Dokument entsprechend der Änderungen nachgeführt wird.

### 3.3 In-App Tooltips & "Info-Schubladen"
Anstatt einer externen Dokumentation können wir diese Beschreibungen direkt in die App einbauen. Bei vielen Diagrammen (besonders in der Korridor-Analyse) existieren bereits kurze `.text-text-muted` Beschreibungen. 
- Für komplexe Daten-Pipelines (Wo kommen die Daten her?) könnte ein `[?]` Icon Button auf jeder Page platziert werden, der einen Slide-Over öffnet. Dieser Slide-Over lädt ein verknüpftes Markdown-File und erklärt dem Endanwender, wie die Zahlen im Backend errechnet werden.
