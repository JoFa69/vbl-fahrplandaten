# Datenbank-Vergleich & Architektur

Es gibt zwei getrennte Datenbank-Dateien, die unterschiedliche Rollen im System spielen. Hier ist die Aufschlüsselung der Tabellen und deren Beziehung.

## 1. Die Datenbanken

### A. `vdv_schedule.duckdb` (Die "Rohdaten-DB")
*   **Erstellt von**: `backend/scripts/import_vdv.py`
*   **Inhalt**: 1:1 Abbild der VDV-Dateien (.x10).
*   **Zweck**: Dient als "Source of Truth" für die Rohdaten. Wird bei Bedarf neu generiert.
*   **Tabellen (Prefix `rec_`)**:
    *   `rec_lid`: Linien-Stammdaten
    *   `rec_ort`: Haltestellen-Stammdaten (Original-Koordinaten)
    *   `rec_frt`: Fahrten
    *   `rec_verlau`: Linienverlauf
    *   `lid_verlauf`: Verknüpfung Linie <-> Verlauf
    *   ... und weitere VDV-spezifische Tabellen.

### B. `20261231_fahrplandaten_2027.db` (Die "Analytics-DB")
*   **Status**: Die bestehende, produktive Datenbank für das Dashboard.
*   **Inhalt**: Transformierte daten im **Star-Schema** (Facts & Dimensions) für schnelle Abfragen.
*   **Tabellen**:
    *   **Dimensionen (`dim_`)**:
        *   `dim_line`: Bereinigte Linien (aus `rec_lid`)
        *   `dim_ort`: Bereinigte Haltestellen (aus `rec_ort` + Geodaten-Update)
        *   `dim_route`: Routen/Varianten
        *   `dim_time`, `dim_date`, `dim_vehicle` etc.
    *   **Fakten (`cub_`)**:
        *   `cub_schedule`: Die eigentlichen Fahrplan-Daten (verknüpft Dimensionen).
        *   `cub_route`: Aggregierte Routen-Daten.
    *   **System**:
        *   `proc_etlrun`, `proc_stechuhr`: Metadaten zum ETL-Prozess.

## 2. Die Verknüpfung (ETL-Prozess)

Die Datenbanken sind physisch getrennt (`.db` Dateien), werden aber im ETL-Prozess logisch verbunden.

1.  **Initialer Load**: Ein (vermutlich früherer) Prozess transformiert Daten aus den `rec_`-Tabellen in die `dim_` und `cub_` Tabellen der Analytics-DB.
2.  **Geometrie-Update (`etl_update_geometries.py`)**:
    *   Verbindet sich zur Haupt-DB.
    *   Führt `ATTACH 'vdv_schedule.duckdb' AS source_db` aus.
    *   Liest/Schreibt quer:
        *   Update `source_db.rec_ort` (in der VDV-DB) mit neuen Koordinaten.
        *   Update `dim_ort` (in der Haupt-DB) basierend auf den Daten aus `source_db`.

## 3. Zusammenfassung für das Durcheinander

*   Es gibt **kein** Schema-Durcheinander im Sinne von "Tabellen liegen am falschen Ort". Die Trennung ist sauber:
    *   `rec_*` = Rohdaten (VDV DB)
    *   `dim_*` / `cub_*` = Analytics (Main DB)
*   Die Namen sind konsistent (`rec_ort` -> `dim_ort`).
*   **Wichtig**: Das Dashboard greift **nur** auf die `20261231_fahrplandaten_2027.db` zu. Änderungen in der `vdv_schedule.duckdb` sind im Dashboard erst sichtbar, wenn ein ETL-Prozess (wie das Update-Script) die Daten von "links nach rechts" schiebt.
