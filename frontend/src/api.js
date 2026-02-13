const API_BASE = "http://localhost:8081/api";

export async function fetchStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchTables() {
    const res = await fetch(`${API_BASE}/tables`);
    if (!res.ok) throw new Error("Failed to fetch tables");
    const json = await res.json();
    return json.tables;
}

export async function fetchTableData(tableName, limit = 100, offset = 0) {
    const res = await fetch(`${API_BASE}/table/${tableName}?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch table data");
    return res.json();
}

// AI API
export async function askAI(question) {
    const res = await fetch(`${API_BASE}/ai/ask`, {
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

// Analytics API
export async function fetchAnalyticsStats() {
    const res = await fetch(`${API_BASE}/analytics/stats`);
    if (!res.ok) throw new Error("Failed to fetch analytics stats");
    return res.json();
}

export async function fetchStopsByLine() {
    const res = await fetch(`${API_BASE}/analytics/stops-by-line`);
    if (!res.ok) throw new Error("Failed to fetch stops by line");
    return res.json();
}

export async function fetchTripsPerHour() {
    const res = await fetch(`${API_BASE}/analytics/trips-per-hour`);
    if (!res.ok) throw new Error("Failed to fetch trips per hour");
    return res.json();
}
// New VDV Metrics APIs
export async function fetchVolumeMetrics(line_no = null, group_by = "line") {
    const params = new URLSearchParams();
    if (line_no) params.append("line_no", line_no);
    if (group_by) params.append("group_by", group_by);

    const res = await fetch(`${API_BASE}/analytics/volume?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch volume metrics");
    return res.json();
}

export async function fetchGeometryMetrics(type = "lines", line_id = null, variant_id = null) {
    const params = new URLSearchParams();
    params.append("type", type);
    if (line_id) params.append("line_id", line_id);
    if (variant_id) params.append("variant_id", variant_id);

    const res = await fetch(`${API_BASE}/analytics/geometry?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch geometry metrics");
    return res.json();
}

export async function fetchTimeMetrics(line_id = null, variant_id = null, metric = "duration") {
    const params = new URLSearchParams();
    if (line_id) params.append("line_id", line_id);
    if (variant_id) params.append("variant_id", variant_id);
    params.append("metric", metric);

    const res = await fetch(`${API_BASE}/analytics/time?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch time metrics");
    return res.json();
}

export async function fetchInfrastructureMetrics(stop_id = null, limit = 10) {
    const params = new URLSearchParams();
    if (stop_id) params.append("stop_id", stop_id);
    params.append("limit", limit);

    const res = await fetch(`${API_BASE}/analytics/infrastructure?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch infrastructure metrics");
    return res.json();
}
