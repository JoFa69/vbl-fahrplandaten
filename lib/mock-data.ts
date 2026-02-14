// Mock-Daten basierend auf dem bestehenden Backend (VDV 452 Fahrplandaten)

export const dbStats = {
  tables: [
    { name: "rec_lid", rows: 142, description: "Linien" },
    { name: "lid_verlauf", rows: 3847, description: "Linienverlauf" },
    { name: "rec_frt", rows: 18934, description: "Fahrten" },
    { name: "sel_fzt_feld", rows: 52103, description: "Fahrzeitfelder" },
    { name: "rec_hp", rows: 487, description: "Haltepunkte" },
    { name: "rec_om", rows: 312, description: "Ortspunkte" },
    { name: "ort_hztf", rows: 1203, description: "Haltezeiten" },
    { name: "firmenkalender", rows: 365, description: "Kalender" },
    { name: "rec_ueb", rows: 89, description: "Umlaeufe" },
  ],
  totalRows: 77482,
  totalTables: 9,
  dbSize: "24.8 MB",
  lastImport: "2025-12-15 14:32:00",
}

export const volumeData = [
  { name: "rec_lid", fahrten: 142, verlauf: 820 },
  { name: "Linie 1", fahrten: 234, verlauf: 1240 },
  { name: "Linie 2", fahrten: 187, verlauf: 980 },
  { name: "Linie 3", fahrten: 312, verlauf: 1650 },
  { name: "Linie 4", fahrten: 156, verlauf: 890 },
  { name: "Linie 5", fahrten: 278, verlauf: 1420 },
  { name: "Linie 6", fahrten: 198, verlauf: 1100 },
  { name: "Linie 7", fahrten: 145, verlauf: 760 },
]

export const timeData = [
  { stunde: "05:00", fahrten: 12 },
  { stunde: "06:00", fahrten: 45 },
  { stunde: "07:00", fahrten: 89 },
  { stunde: "08:00", fahrten: 78 },
  { stunde: "09:00", fahrten: 52 },
  { stunde: "10:00", fahrten: 38 },
  { stunde: "11:00", fahrten: 35 },
  { stunde: "12:00", fahrten: 42 },
  { stunde: "13:00", fahrten: 48 },
  { stunde: "14:00", fahrten: 55 },
  { stunde: "15:00", fahrten: 72 },
  { stunde: "16:00", fahrten: 85 },
  { stunde: "17:00", fahrten: 92 },
  { stunde: "18:00", fahrten: 68 },
  { stunde: "19:00", fahrten: 42 },
  { stunde: "20:00", fahrten: 28 },
  { stunde: "21:00", fahrten: 18 },
  { stunde: "22:00", fahrten: 12 },
  { stunde: "23:00", fahrten: 6 },
]

export const infraData = [
  { name: "Haltestellen", count: 487 },
  { name: "Linien", count: 142 },
  { name: "Umlaeufe", count: 89 },
  { name: "Ortspunkte", count: 312 },
  { name: "Fahrzeitfelder", count: 52103 },
]

export const tableColumns: Record<string, string[]> = {
  rec_lid: ["LI_NR", "ROESSION_NR", "LI_KUERZEL", "LIDNAME", "LI_RI_NR"],
  lid_verlauf: ["LI_NR", "LI_RI_NR", "LI_LFD_NR", "ORT_NR", "HP_HZT"],
  rec_frt: ["FRT_FID", "FRT_START", "FRT_HP_AUS", "LI_NR", "FGR_NR", "TAGESART_NR"],
  rec_hp: ["ORT_NR", "HP_BEZEICHNUNG", "HP_KUERZEL", "HP_X", "HP_Y"],
  rec_om: ["ORT_NR", "ORT_NAME", "ORT_POS_BREITE", "ORT_POS_LAENGE"],
}

export const sampleTableData: Record<string, Record<string, string | number>[]> = {
  rec_lid: [
    { LI_NR: 1, ROESSION_NR: 1, LI_KUERZEL: "1", LIDNAME: "Hauptbahnhof - Mattenhof", LI_RI_NR: 1 },
    { LI_NR: 1, ROESSION_NR: 1, LI_KUERZEL: "1", LIDNAME: "Mattenhof - Hauptbahnhof", LI_RI_NR: 2 },
    { LI_NR: 2, ROESSION_NR: 1, LI_KUERZEL: "2", LIDNAME: "Obernau - Kriens", LI_RI_NR: 1 },
    { LI_NR: 2, ROESSION_NR: 1, LI_KUERZEL: "2", LIDNAME: "Kriens - Obernau", LI_RI_NR: 2 },
    { LI_NR: 3, ROESSION_NR: 1, LI_KUERZEL: "3", LIDNAME: "Littau - Verkehrshaus", LI_RI_NR: 1 },
    { LI_NR: 3, ROESSION_NR: 1, LI_KUERZEL: "3", LIDNAME: "Verkehrshaus - Littau", LI_RI_NR: 2 },
    { LI_NR: 4, ROESSION_NR: 1, LI_KUERZEL: "4", LIDNAME: "Hubelmatt - Bruecke", LI_RI_NR: 1 },
    { LI_NR: 5, ROESSION_NR: 1, LI_KUERZEL: "5", LIDNAME: "Emmenbruecke - Luzern", LI_RI_NR: 1 },
  ],
  rec_hp: [
    { ORT_NR: 101, HP_BEZEICHNUNG: "Hauptbahnhof", HP_KUERZEL: "HB", HP_X: 2666180, HP_Y: 1211780 },
    { ORT_NR: 102, HP_BEZEICHNUNG: "Kantonalbank", HP_KUERZEL: "KB", HP_X: 2666350, HP_Y: 1211920 },
    { ORT_NR: 103, HP_BEZEICHNUNG: "Pilatusplatz", HP_KUERZEL: "PP", HP_X: 2665890, HP_Y: 1211450 },
    { ORT_NR: 104, HP_BEZEICHNUNG: "Bruecke/Verkehrshaus", HP_KUERZEL: "BV", HP_X: 2667120, HP_Y: 1211150 },
    { ORT_NR: 105, HP_BEZEICHNUNG: "Mattenhof", HP_KUERZEL: "MH", HP_X: 2665200, HP_Y: 1210800 },
    { ORT_NR: 106, HP_BEZEICHNUNG: "Kriens Busschleife", HP_KUERZEL: "KBS", HP_X: 2664800, HP_Y: 1210200 },
  ],
}

export const aiChatHistory = [
  {
    role: "user" as const,
    message: "Wie viele Fahrten gibt es auf Linie 1?",
  },
  {
    role: "assistant" as const,
    message: "Auf Linie 1 gibt es insgesamt 234 Fahrten in beide Richtungen. Davon sind 118 in Richtung Mattenhof und 116 in Richtung Hauptbahnhof.",
    sql: "SELECT COUNT(*) FROM rec_frt WHERE LI_NR = 1;",
  },
]
