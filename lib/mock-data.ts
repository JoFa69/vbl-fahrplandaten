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
  { name: "Varianten", value: 36, fill: "var(--color-chart-sky)" },
]

export const sanityCheckData = [
  { id: "ERR-001", type: "Missing Stop", severity: "high", line: "Linie 3", detail: "Haltestelle 'Kantonsspital' fehlt in Route 3.2A", trip: "F-3042", timestamp: "14:23" },
  { id: "ERR-002", type: "Impossible Speed", severity: "high", line: "Linie 1", detail: "142 km/h zwischen Mattenhof und Pilatusplatz", trip: "F-1087", timestamp: "07:45" },
  { id: "ERR-003", type: "Duplicate Stop", severity: "medium", line: "Linie 5", detail: "Haltestelle 'Bahnhof' doppelt in Sequenz", trip: "F-5023", timestamp: "09:12" },
  { id: "WRN-004", type: "Short Layover", severity: "medium", line: "Linie 2", detail: "Wendezeit 2 Min. an Endstation Obernau", trip: "F-2156", timestamp: "16:35" },
  { id: "WRN-005", type: "Missing Time", severity: "low", line: "Linie 7", detail: "Abfahrtszeit fehlt an Haltestelle Reussbuehl", trip: "F-7018", timestamp: "11:08" },
  { id: "ERR-006", type: "Impossible Speed", severity: "high", line: "Linie 10", detail: "98 km/h zwischen Bueholz und Littauerberg", trip: "F-10034", timestamp: "08:22" },
  { id: "WRN-007", type: "Overlap", severity: "medium", line: "Linie 4", detail: "Fahrt ueberlappt mit F-4089 am Hubelmatt", trip: "F-4091", timestamp: "17:50" },
  { id: "WRN-008", type: "Missing Stop", severity: "low", line: "Linie 12", detail: "Haltestelle 'Kantonalbank' nicht im VDV-Export", trip: "F-12005", timestamp: "06:30" },
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
