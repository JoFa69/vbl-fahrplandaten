// Transit Planner OS - Mock Data

export const kpiData = {
  totalDailyTrips: 1247,
  revenueKilometers: 18432,
  avgCommercialSpeed: 21.6,
  criticalLayovers: 23,
}

export const allLines = [
  "Linie 1", "Linie 2", "Linie 3", "Linie 4", "Linie 5",
  "Linie 6", "Linie 7", "Linie 8", "Linie 10", "Linie 12",
]

export const frequencySpeedData = [
  { hour: "05", departures: 18, speed: 24.2 },
  { hour: "06", departures: 52, speed: 22.8 },
  { hour: "07", departures: 94, speed: 18.3 },
  { hour: "08", departures: 86, speed: 17.9 },
  { hour: "09", departures: 58, speed: 20.5 },
  { hour: "10", departures: 42, speed: 22.1 },
  { hour: "11", departures: 40, speed: 22.4 },
  { hour: "12", departures: 48, speed: 21.2 },
  { hour: "13", departures: 52, speed: 21.0 },
  { hour: "14", departures: 56, speed: 20.8 },
  { hour: "15", departures: 68, speed: 19.6 },
  { hour: "16", departures: 88, speed: 18.1 },
  { hour: "17", departures: 96, speed: 17.4 },
  { hour: "18", departures: 78, speed: 19.2 },
  { hour: "19", departures: 52, speed: 21.8 },
  { hour: "20", departures: 34, speed: 23.5 },
  { hour: "21", departures: 22, speed: 24.1 },
  { hour: "22", departures: 14, speed: 25.0 },
  { hour: "23", departures: 8, speed: 25.8 },
]

export const routeComplexityData = [
  { name: "Standardrouten", value: 64, fill: "var(--color-chart-blue)" },
  { name: "Routenvarianten", value: 28, fill: "var(--color-chart-sky)" },
  { name: "Sonderfahrten", value: 8, fill: "var(--color-chart-amber)" },
]

export const sanityCheckData = [
  { id: "ERR-001", type: "Missing Stop", severity: "high" as const, line: "Linie 3", detail: "Haltestelle 'Kantonsspital' fehlt in Route 3.2A", trip: "F-3042", timestamp: "14:23" },
  { id: "ERR-002", type: "Impossible Speed", severity: "high" as const, line: "Linie 1", detail: "142 km/h zwischen Mattenhof und Pilatusplatz", trip: "F-1087", timestamp: "07:45" },
  { id: "ERR-003", type: "Duplicate Stop", severity: "medium" as const, line: "Linie 5", detail: "Haltestelle 'Bahnhof' doppelt in Sequenz", trip: "F-5023", timestamp: "09:12" },
  { id: "WRN-004", type: "Short Layover", severity: "medium" as const, line: "Linie 2", detail: "Wendezeit 2 Min. an Endstation Obernau", trip: "F-2156", timestamp: "16:35" },
  { id: "WRN-005", type: "Missing Time", severity: "low" as const, line: "Linie 7", detail: "Abfahrtszeit fehlt an Haltestelle Reussbuehl", trip: "F-7018", timestamp: "11:08" },
  { id: "ERR-006", type: "Impossible Speed", severity: "high" as const, line: "Linie 10", detail: "98 km/h zwischen Bueholz und Littauerberg", trip: "F-10034", timestamp: "08:22" },
  { id: "WRN-007", type: "Overlap", severity: "medium" as const, line: "Linie 4", detail: "Fahrt ueberlappt mit F-4089 am Hubelmatt", trip: "F-4091", timestamp: "17:50" },
  { id: "WRN-008", type: "Missing Stop", severity: "low" as const, line: "Linie 12", detail: "Haltestelle 'Kantonalbank' nicht im VDV-Export", trip: "F-12005", timestamp: "06:30" },
]

export const networkAlerts = [
  { id: "NET-01", message: "Linie 1: Umleitung Pilatusplatz ab 09.12.", severity: "info" as const },
  { id: "NET-02", message: "3 Linien mit Wendezeit unter 3 Minuten", severity: "warning" as const },
  { id: "NET-03", message: "Import vom 15.02.2026 fehlerhaft (8 Fehler)", severity: "error" as const },
  { id: "NET-04", message: "Linie 10: Fahrzeit Bueholz-Littau ueberprueft", severity: "info" as const },
]

export const mapStops = [
  { name: "Mattenhof", x: 12, y: 55 },
  { name: "Pilatusplatz", x: 25, y: 45 },
  { name: "HB Luzern", x: 42, y: 38 },
  { name: "Schweizerhof", x: 55, y: 35 },
  { name: "Verkehrshaus", x: 72, y: 30 },
  { name: "Bruecke", x: 35, y: 60 },
  { name: "Kriens", x: 18, y: 72 },
  { name: "Obernau", x: 8, y: 85 },
  { name: "Emmenbruecke", x: 48, y: 18 },
  { name: "Littau", x: 28, y: 22 },
  { name: "Adligenswil", x: 68, y: 55 },
  { name: "Reussbuehl", x: 38, y: 15 },
  { name: "Wuerzenbach", x: 62, y: 45 },
  { name: "Bueholz", x: 52, y: 65 },
  { name: "Spital", x: 58, y: 25 },
]

export const mapRoutes = [
  { from: 0, to: 1, line: "1" },
  { from: 1, to: 2, line: "1" },
  { from: 2, to: 3, line: "1" },
  { from: 6, to: 5, line: "2" },
  { from: 5, to: 2, line: "2" },
  { from: 7, to: 6, line: "2" },
  { from: 9, to: 2, line: "3" },
  { from: 2, to: 4, line: "3" },
  { from: 8, to: 2, line: "5" },
  { from: 2, to: 10, line: "6" },
  { from: 11, to: 12, line: "7" },
  { from: 2, to: 14, line: "12" },
  { from: 2, to: 13, line: "10" },
]

// TAB 2: Corridor + Headway data
export const corridorFrequencyData = [
  { time: "06:00", line1: 6, line4: 0, combined: 6 },
  { time: "06:10", line1: 0, line4: 5, combined: 5 },
  { time: "06:15", line1: 6, line4: 0, combined: 6 },
  { time: "06:20", line1: 0, line4: 5, combined: 5 },
  { time: "06:30", line1: 6, line4: 0, combined: 6 },
  { time: "06:35", line1: 0, line4: 5, combined: 5 },
  { time: "06:45", line1: 6, line4: 0, combined: 6 },
  { time: "06:50", line1: 0, line4: 5, combined: 5 },
  { time: "07:00", line1: 6, line4: 0, combined: 6 },
  { time: "07:05", line1: 0, line4: 5, combined: 5 },
  { time: "07:15", line1: 6, line4: 0, combined: 6 },
  { time: "07:20", line1: 0, line4: 5, combined: 5 },
  { time: "07:30", line1: 6, line4: 0, combined: 6 },
  { time: "07:35", line1: 0, line4: 5, combined: 5 },
  { time: "07:45", line1: 6, line4: 0, combined: 6 },
  { time: "07:50", line1: 0, line4: 5, combined: 5 },
]

export const headwayTableData = [
  { lineId: "Linie 1", direction: "Mattenhof - Maihof", firstTrip: "05:15", lastTrip: "23:45", headway: "10 min", totalTrips: 112, maxLoad: 847 },
  { lineId: "Linie 2", direction: "Obernau - Kriens", firstTrip: "05:30", lastTrip: "23:30", headway: "15 min", totalTrips: 74, maxLoad: 612 },
  { lineId: "Linie 3", direction: "Littau - Verkehrshaus", firstTrip: "05:45", lastTrip: "23:15", headway: "12 min", totalTrips: 88, maxLoad: 723 },
  { lineId: "Linie 4", direction: "HB Luzern - Hubelmatt", firstTrip: "05:20", lastTrip: "23:50", headway: "10 min", totalTrips: 108, maxLoad: 891 },
  { lineId: "Linie 5", direction: "Emmenbruecke - Bahnhof", firstTrip: "06:00", lastTrip: "22:45", headway: "15 min", totalTrips: 68, maxLoad: 534 },
  { lineId: "Linie 6", direction: "HB Luzern - Adligenswil", firstTrip: "05:35", lastTrip: "23:20", headway: "20 min", totalTrips: 54, maxLoad: 412 },
  { lineId: "Linie 7", direction: "Reussbuehl - Wuerzenbach", firstTrip: "06:00", lastTrip: "22:30", headway: "15 min", totalTrips: 66, maxLoad: 489 },
  { lineId: "Linie 8", direction: "HB Luzern - Hirtenhof", firstTrip: "06:15", lastTrip: "22:00", headway: "20 min", totalTrips: 48, maxLoad: 378 },
  { lineId: "Linie 10", direction: "HB Luzern - Bueholz", firstTrip: "05:50", lastTrip: "23:00", headway: "12 min", totalTrips: 86, maxLoad: 678 },
  { lineId: "Linie 12", direction: "HB Luzern - Spital", firstTrip: "06:00", lastTrip: "22:15", headway: "15 min", totalTrips: 64, maxLoad: 423 },
]

// TAB 3: VDV raw data explorer
export const vdvTables = {
  LINIE: {
    columns: ["LI_NR", "STR_LI_VAR", "LI_KUERZEL", "LIDNAME", "LI_RI_NR"],
    rows: [
      ["1", "1", "L01", "Mattenhof - Maihof", "1"],
      ["1", "2", "L01", "Maihof - Mattenhof", "2"],
      ["2", "1", "L02", "Obernau - Kriens", "1"],
      ["2", "2", "L02", "Kriens - Obernau", "2"],
      ["3", "1", "L03", "Littau - Verkehrshaus", "1"],
      ["3", "2", "L03", "Verkehrshaus - Littau", "2"],
      ["4", "1", "L04", "HB Luzern - Hubelmatt", "1"],
      ["5", "1", "L05", "Emmenbruecke - Bahnhof", "1"],
      ["6", "1", "L06", "HB Luzern - Adligenswil", "1"],
      ["7", "1", "L07", "Reussbuehl - Wuerzenbach", "1"],
      ["10", "1", "L10", "HB Luzern - Bueholz", "1"],
      ["12", "1", "L12", "HB Luzern - Spital", "1"],
    ],
  },
  FAHRT: {
    columns: ["FRT_FID", "LI_NR", "FRT_START", "FRT_HP_ANF", "FRT_HP_END", "TAGESART"],
    rows: [
      ["10001", "1", "05:15", "Mattenhof", "Maihof", "Werktag"],
      ["10002", "1", "05:25", "Maihof", "Mattenhof", "Werktag"],
      ["10003", "1", "05:35", "Mattenhof", "Maihof", "Werktag"],
      ["10004", "2", "05:30", "Obernau", "Kriens", "Werktag"],
      ["10005", "3", "05:45", "Littau", "Verkehrshaus", "Werktag"],
      ["10006", "4", "05:20", "HB Luzern", "Hubelmatt", "Werktag"],
      ["10007", "5", "06:00", "Emmenbruecke", "Bahnhof", "Werktag"],
      ["10008", "6", "05:35", "HB Luzern", "Adligenswil", "Werktag"],
      ["10009", "10", "05:50", "HB Luzern", "Bueholz", "Werktag"],
      ["10010", "12", "06:00", "HB Luzern", "Spital", "Werktag"],
    ],
  },
  ROUTE: {
    columns: ["LI_NR", "STR_LI_VAR", "LI_RI_NR", "ROUTE_REF", "ROUTE_LEN_KM"],
    rows: [
      ["1", "1", "1", "R-1A", "8.4"],
      ["1", "1", "2", "R-1B", "8.6"],
      ["2", "1", "1", "R-2A", "6.2"],
      ["3", "1", "1", "R-3A", "9.1"],
      ["4", "1", "1", "R-4A", "5.8"],
      ["5", "1", "1", "R-5A", "4.3"],
      ["6", "1", "1", "R-6A", "7.5"],
      ["7", "1", "1", "R-7A", "5.9"],
      ["10", "1", "1", "R-10A", "6.7"],
      ["12", "1", "1", "R-12A", "4.8"],
    ],
  },
  ORT: {
    columns: ["ORT_NR", "ORT_NAME", "ORT_REF_ORT", "ORT_POS_BREITE", "ORT_POS_LAENGE"],
    rows: [
      ["101", "Mattenhof", "LU-MH", "47.0455", "8.2880"],
      ["102", "Pilatusplatz", "LU-PP", "47.0479", "8.2972"],
      ["103", "HB Luzern", "LU-HB", "47.0502", "8.3093"],
      ["104", "Schweizerhof", "LU-SH", "47.0515", "8.3148"],
      ["105", "Verkehrshaus", "LU-VH", "47.0536", "8.3359"],
      ["106", "Kriens", "LU-KR", "47.0347", "8.2812"],
      ["107", "Obernau", "LU-OB", "47.0248", "8.2653"],
      ["108", "Emmenbruecke", "LU-EB", "47.0681", "8.3055"],
      ["109", "Littau", "LU-LI", "47.0588", "8.2742"],
      ["110", "Reussbuehl", "LU-RB", "47.0632", "8.2915"],
    ],
  },
}
