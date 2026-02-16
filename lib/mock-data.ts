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

export const linePerformanceData = [
  { lineId: "1", direction: "Mattenhof - HB", totalTrips: 118, maxLoad: 312, minLoad: 24, avgTravelTime: "22 min" },
  { lineId: "1", direction: "HB - Mattenhof", totalTrips: 116, maxLoad: 298, minLoad: 18, avgTravelTime: "24 min" },
  { lineId: "2", direction: "Obernau - Kriens", totalTrips: 94, maxLoad: 245, minLoad: 32, avgTravelTime: "18 min" },
  { lineId: "2", direction: "Kriens - Obernau", totalTrips: 93, maxLoad: 228, minLoad: 28, avgTravelTime: "19 min" },
  { lineId: "3", direction: "Littau - Verkehrshaus", totalTrips: 156, maxLoad: 387, minLoad: 45, avgTravelTime: "31 min" },
  { lineId: "3", direction: "Verkehrshaus - Littau", totalTrips: 154, maxLoad: 372, minLoad: 38, avgTravelTime: "33 min" },
  { lineId: "4", direction: "Hubelmatt - Bruecke", totalTrips: 78, maxLoad: 198, minLoad: 12, avgTravelTime: "15 min" },
  { lineId: "4", direction: "Bruecke - Hubelmatt", totalTrips: 76, maxLoad: 185, minLoad: 15, avgTravelTime: "16 min" },
  { lineId: "5", direction: "Emmenbruecke - HB", totalTrips: 134, maxLoad: 356, minLoad: 52, avgTravelTime: "26 min" },
  { lineId: "5", direction: "HB - Emmenbruecke", totalTrips: 132, maxLoad: 341, minLoad: 48, avgTravelTime: "27 min" },
  { lineId: "6", direction: "Adligenswil - HB", totalTrips: 98, maxLoad: 267, minLoad: 22, avgTravelTime: "20 min" },
  { lineId: "6", direction: "HB - Adligenswil", totalTrips: 96, maxLoad: 254, minLoad: 19, avgTravelTime: "21 min" },
  { lineId: "7", direction: "Reussbuehl - Wuerzenbach", totalTrips: 72, maxLoad: 178, minLoad: 14, avgTravelTime: "28 min" },
  { lineId: "7", direction: "Wuerzenbach - Reussbuehl", totalTrips: 70, maxLoad: 165, minLoad: 11, avgTravelTime: "29 min" },
  { lineId: "8", direction: "Hirtenhof - Ruopigen", totalTrips: 64, maxLoad: 142, minLoad: 8, avgTravelTime: "17 min" },
  { lineId: "8", direction: "Ruopigen - Hirtenhof", totalTrips: 62, maxLoad: 136, minLoad: 10, avgTravelTime: "18 min" },
  { lineId: "10", direction: "Obergutsch - Bueholz", totalTrips: 88, maxLoad: 223, minLoad: 26, avgTravelTime: "35 min" },
  { lineId: "10", direction: "Bueholz - Obergutsch", totalTrips: 86, maxLoad: 215, minLoad: 21, avgTravelTime: "36 min" },
  { lineId: "12", direction: "Zentrum - Spital", totalTrips: 52, maxLoad: 145, minLoad: 16, avgTravelTime: "12 min" },
  { lineId: "12", direction: "Spital - Zentrum", totalTrips: 50, maxLoad: 138, minLoad: 13, avgTravelTime: "13 min" },
]
