# Technische Dokumentation: ETL-Prozess & Datenbank-Struktur

## 1. ETL-Prozess (Extract, Transform, Load)

Der ETL-Prozess besteht aus zwei Hauptkomponenten, die Daten aus VDV-Dateien und externen Geodatenquellen in eine DuckDB-Datenbank integrieren.

### 1.1 VDV-Import (`backend/scripts/import_vdv.py`)
*   **Quelle**: `.x10` Dateien (VDV 452 Standard) im Ordner `backend/data`.
*   **Prozess**:
    1.  Extrahiert ZIP-Archive, falls nötig.
    2.  Liest jede `.x10` Datei ein.
    3.  Analysiert die Header (`atr;`, `rec;`) um das Schema zu bestimmen.
    4.  Erstellt für jede Datei eine Tabelle in `vdv_schedule.duckdb` (z.B. `rec_ort`, `rec_lid`, `lid_verlauf`).
    5.  Erstellt Views (`v_rec_frt`, `v_rec_ort`) und führt Integritätsprüfungen durch (z.B. verwaiste Linienverweise).

### 1.2 Geodaten-Update (`backend/scripts/etl_update_geometries.py`)
*   **Quelle**: CSV-Datei von opentransportdata.swiss (`actual-date-world-traffic-point...`).
*   **Prozess**:
    1.  Lädt die CSV-Datei in eine temporäre Tabelle `raw_stops`.
    2.  Verbindet sich mit der Hauptdatenbank `20261231_fahrplandaten_2027.db` und attacht `vdv_schedule.duckdb`.
    3.  **Update Schritt**: Aktualisiert `dim_ort` (Haupt-DB) und `rec_ort` (VDV-DB) mit Koordinaten (`lat`, `lon`) basierend auf der Matches zwischen `HST_NR_NATIONAL` und `numberShort`.
    
    > **Wichtiges Detail/Problem**: Dieser Prozess scheint eine 1:1 Zuordnung anzustreben. Wenn ein Haltestellenkürzel (`stop_abbr`) mehrere physische Punkte (Steige/Punkte) hat, wird möglicherweise nur einer übernommen oder überschrieben.

---

## 2. Datenbank-Struktur (DuckDB)

Die Hauptdatenbank (`20261231_fahrplandaten_2027.db`) folgt einem **Star-Schema** für Analytics, während die `vdv_schedule.duckdb` die Rohdaten im relationalen VDV-Format hält.

### 2.1 Wichtige Tabellen (Main DB)

| Tabelle | Beschreibung | Wichtige Spalten |
| :--- | :--- | :--- |
| **`dim_line`** | Definition der Linien | `li_id`, `li_no` (Nummer), `li_text` (Name), `li_ri_no` (Richtung) |
| **`dim_route`** | Definition der Routen/Varianten | `route_id`, `route_hash`, `li_lfd_nr` (Sequenz), `ideal_stop_nr` (Verknüpfung zur Haltestelle) |
| **`dim_ort`** | Haltestellen & Koordinaten | `stop_id`, `stop_abbr` (Kürzel), `stop_text` (Name), `lat`, `lon` |
| **`cub_schedule`** | Fahrplan/Fahrten (Fact Table) | `frt_id`, `li_id` (Ref Linie), `route_id` (Ref Route), `frt_start` (Abfahrtzeit) |

### 2.2 Rohdaten-Tabellen (in `vdv_schedule.duckdb`)
Diese Tabellen entsprechen direkt den VDV-Dateien:
*   **`rec_lid`**: Linien-Definitionen.
*   **`lid_verlauf`**: Verlauf der Linien (Reihenfolge der Haltestellen).
*   **`rec_ort`**: Orte/Haltestellen Basisdaten.

---

## 3. Identifizierte Probleme in der Datenstruktur

### 3.1 Aggregation von Koordinaten
In der Tabelle `dim_ort` gibt es zwar `stop_point_no`, aber die API-Abfragen gruppieren oft über `stop_abbr` und wählen `MAX(lat)` / `MAX(lon)`.

**Analyse:**
Die Datenbank enthält durchaus mehrere Einträge für denselben `stop_abbr` (z.B. für verschiedene Steige).
```sql
SELECT stop_abbr, count(*) FROM dim_ort GROUP BY stop_abbr HAVING count(*) > 1;
-- Ergebnis: Viele Haltestellen haben > 1 Eintrag (z.B. KRS mit 5 Einträgen)
```
Da die Geometrie-Logik jedoch oft eine eindeutige Koordinate pro logischer Haltestelle (nicht pro Steig) anfordert, kommt es zur "falschen Lokalisierung", wenn der falschen Steig gewählt wird.

### 3.2 Fehlende Streckengeometrie
Die Datenbank enthält nur Punkt-Koordinaten für Haltestellen. Es gibt keine Informationen über den tatsächlichen Straßenverlauf (Polylines) zwischen den Haltestellen. Die Darstellung als gerade Linie ist daher eine direkte Folge der vorhandenen Daten.
