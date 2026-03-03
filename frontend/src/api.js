const API_BASE = "/api";

// Helper function to dynamically add headers from localStorage (like scenario)
async function apiFetch(url, options = {}) {
    const defaultScenario = "strategic";
    const currentScenario = localStorage.getItem("vbl_scenario") || defaultScenario;

    const headers = {
        ...options.headers,
        "x-scenario": currentScenario
    };

    return fetch(url, { ...options, headers });
}

export async function fetchStats() {
    const res = await apiFetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchTables() {
    const res = await apiFetch(`${API_BASE}/tables`);
    if (!res.ok) throw new Error("Failed to fetch tables");
    const json = await res.json();
    return json.tables;
}

export async function fetchTableData(tableName, limit = 100, offset = 0) {
    const res = await apiFetch(`${API_BASE}/table/${tableName}?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch table data");
    return res.json();
}

// AI API
export async function askAI(question) {
    const res = await apiFetch(`${API_BASE}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to ask AI");
    }
    return res.json();
}

// Lines API
export async function fetchLines() {
    const res = await apiFetch(`${API_BASE}/lines`);
    if (!res.ok) throw new Error("Failed to fetch lines");
    return res.json();
}

export async function fetchLineVariants(line_no, direction_id = 1) {
    const res = await apiFetch(`${API_BASE}/lines/${line_no}/variants?direction_id=${direction_id}`);
    if (!res.ok) throw new Error("Failed to fetch line variants");
    return res.json();
}

// Analytics API
export async function fetchAnalyticsStats() {
    const res = await apiFetch(`${API_BASE}/analytics/stats`);
    if (!res.ok) throw new Error("Failed to fetch analytics stats");
    return res.json();
}

export async function fetchStopsByLine() {
    const res = await apiFetch(`${API_BASE}/analytics/stops-by-line`);
    if (!res.ok) throw new Error("Failed to fetch stops by line");
    return res.json();
}

export async function fetchTripsPerHour() {
    const res = await apiFetch(`${API_BASE}/analytics/trips-per-hour`);
    if (!res.ok) throw new Error("Failed to fetch trips per hour");
    return res.json();
}
// New VDV Metrics APIs
export async function fetchVolumeMetrics(line_no = null, group_by = "line") {
    const params = new URLSearchParams();
    if (line_no) params.append("line_no", line_no);
    if (group_by) params.append("group_by", group_by);

    const res = await apiFetch(`${API_BASE}/analytics/volume?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch volume metrics");
    return res.json();
}

export async function fetchTimetableHeatmap(line_no, tagesart = "Alle", richtung = null) {
    const params = new URLSearchParams({ line_no });
    if (tagesart && tagesart !== "Alle") params.append("tagesart", tagesart);
    if (richtung) params.append("richtung", richtung);

    const res = await apiFetch(`${API_BASE}/analytics/timetable/heatmap?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch timetable heatmap");
    return res.json();
}

export async function fetchTimetableHeadway(line_no, tagesart = "Alle", richtung = null) {
    const params = new URLSearchParams({ line_no });
    if (tagesart && tagesart !== "Alle") params.append("tagesart", tagesart);
    if (richtung) params.append("richtung", richtung);

    const res = await apiFetch(`${API_BASE}/analytics/timetable/headway?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch timetable headway");
    return res.json();
}

export async function fetchTimetableKPIs(line_no, tagesart = "Alle") {
    const params = new URLSearchParams({ line_no });
    if (tagesart && tagesart !== "Alle") params.append("tagesart", tagesart);

    const res = await apiFetch(`${API_BASE}/analytics/timetable/kpis?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch timetable KPIs");
    return res.json();
}

export async function fetchTimetableTagesarten() {
    const res = await apiFetch(`${API_BASE}/analytics/timetable/tagesarten`);
    if (!res.ok) throw new Error("Failed to fetch timetable tagesarten");
    return res.json();
}

export async function fetchGeometryMetrics(type = "lines", line_id = null, variant_id = null, line_no = null, fahrtart = null) {
    const params = new URLSearchParams();
    params.append("type", type);
    if (line_no) params.append("line_no", line_no);
    else if (line_id) params.append("line_id", line_id);
    if (variant_id) params.append("variant_id", variant_id);
    if (fahrtart) params.append("fahrtart", fahrtart);

    const res = await apiFetch(`${API_BASE}/analytics/geometry?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch geometry metrics");
    return res.json();
}

export async function fetchTimeMetrics(line_id = null, variant_id = null, metric = "duration") {
    const params = new URLSearchParams();
    if (line_id) params.append("line_id", line_id);
    if (variant_id) params.append("variant_id", variant_id);
    params.append("metric", metric);

    const res = await apiFetch(`${API_BASE}/analytics/time?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch time metrics");
    return res.json();
}

export async function fetchInfrastructureMetrics(stop_id = null, limit = 10) {
    const params = new URLSearchParams();
    if (stop_id) params.append("stop_id", stop_id);
    params.append("limit", limit);

    const res = await apiFetch(`${API_BASE}/analytics/infrastructure?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch infrastructure metrics");
    return res.json();
}

export async function fetchNetworkNodes(tagesart, time_from, time_to, richtung = null) {
    const params = new URLSearchParams();
    if (tagesart) params.append("tagesart", tagesart);
    if (time_from !== undefined) params.append("time_from", time_from);
    if (time_to !== undefined) params.append("time_to", time_to);
    if (richtung) params.append("richtung", richtung);

    const res = await apiFetch(`${API_BASE}/analytics/network-nodes?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch network nodes");
    return res.json();
}



export async function fetchRouteGeometry(line_id, route_id = null) {
    let url = `${API_BASE}/analytics/geometry/route/${line_id}`;
    if (route_id) {
        url += `?route_id=${route_id}`;
    }
    const res = await apiFetch(url);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch route geometry");
    }
    return res.json();
}

export async function fetchAllStops(tagesart = null) {
    const params = new URLSearchParams();
    if (tagesart && tagesart !== "Alle") params.append("tagesart", tagesart);

    const res = await apiFetch(`${API_BASE}/stops?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch all stops");
    return res.json();
}

export async function fetchPrimaryRoutes(fahrtart = null) {
    const params = new URLSearchParams();
    if (fahrtart) params.append("fahrtart", fahrtart);
    const res = await apiFetch(`${API_BASE}/analytics/geometry/routes/primary?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch primary routes");
    return res.json();
}

// Raw VDV Files
export async function fetchRawFiles() {
    const res = await apiFetch(`${API_BASE}/raw-files`);
    if (!res.ok) throw new Error("Failed to fetch raw files");
    return res.json();
}

export async function fetchRawFilePreview(filename, limit = 50, offset = 0) {
    const res = await apiFetch(`${API_BASE}/raw-file/${filename}?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch raw file preview");
    return res.json();
}

// Corridor APIs
export async function fetchCorridorMatrix(stop_id, tagesart = "Mo-Fr", richtung = null) {
    const params = new URLSearchParams({ stop_id, tagesart });
    if (richtung) params.append("richtung", richtung);
    const res = await apiFetch(`${API_BASE}/analytics/corridor/matrix?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch corridor matrix");
    return res.json();
}

export async function fetchCorridorFrequency(stop_id, tagesart = "Mo-Fr", richtung = null) {
    const params = new URLSearchParams({ stop_id, tagesart });
    if (richtung) params.append("richtung", richtung);
    const res = await apiFetch(`${API_BASE}/analytics/corridor/frequency?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch corridor frequency");
    return res.json();
}

export async function fetchCorridorHeadway(stop_id, tagesart = "Mo-Fr", richtung = null) {
    const params = new URLSearchParams({ stop_id, tagesart });
    if (richtung) params.append("richtung", richtung);
    const res = await apiFetch(`${API_BASE}/analytics/corridor/headway?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch corridor headway");
    return res.json();
}

export async function fetchCorridorBildfahrplan(stop_id_start, stop_id_end, tagesart = "Mo-Fr") {
    const params = new URLSearchParams({ stop_id_start, stop_id_end, tagesart });
    const res = await apiFetch(`${API_BASE}/analytics/corridor/bildfahrplan?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch corridor bildfahrplan");
    return res.json();
}
