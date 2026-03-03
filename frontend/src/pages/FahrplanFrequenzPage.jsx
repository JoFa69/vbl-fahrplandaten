import React, { useState, useEffect } from 'react';
import {
    fetchLines,
    fetchVolumeMetrics,
    fetchTimetableHeatmap,
    fetchTimetableHeadway,
    fetchTimetableKPIs,
    fetchTimetableTagesarten
} from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';

const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const displayH = h >= 24 ? h - 24 : h;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                <p className="text-white font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-300">{entry.name}:</span>
                        <span className="text-white font-bold">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function FahrplanFrequenzPage() {
    const [lines, setLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [tagesart, setTagesart] = useState("Alle");
    const [tagesartenOptionen, setTagesartenOptionen] = useState([{ abbr: "Alle", text: "Alle Tage" }]);
    const [richtung, setRichtung] = useState("");

    const [loading, setLoading] = useState(true);
    const [volumeData, setVolumeData] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [headwayData, setHeadwayData] = useState([]);
    const [kpiData, setKpiData] = useState(null);

    // Initial Laden
    useEffect(() => {
        async function loadInitialData() {
            try {
                const [linesData, tagData] = await Promise.all([
                    fetchLines(),
                    fetchTimetableTagesarten()
                ]);

                setLines(linesData || []);
                if (linesData && linesData.length > 0) {
                    setSelectedLine(linesData[0].line_no);
                }

                const defaultTag = { abbr: "Alle", text: "Alle Tage" };
                if (tagData && tagData.length > 0) {
                    setTagesartenOptionen([defaultTag, ...tagData]);
                    const startsMoFr = tagData.find((t) => t.abbr === "Mo-Fr");
                    if (startsMoFr) setTagesart(startsMoFr.abbr);
                    else setTagesart(tagData[0].abbr);
                } else {
                    setTagesartenOptionen([defaultTag]);
                }
            } catch (e) {
                console.error('Failed to load initial data', e);
            } finally {
                setLoading(false);
            }
        }
        loadInitialData();
    }, []);

    // Wenn Filter sich ändern: Daten laden
    useEffect(() => {
        if (!selectedLine) return;

        async function loadData() {
            setLoading(true);
            try {
                const r = richtung === "" ? null : parseInt(richtung);

                const [vol, heat, head, kpis] = await Promise.all([
                    fetchVolumeMetrics(selectedLine, 'hour'),
                    fetchTimetableHeatmap(selectedLine, tagesart, r),
                    fetchTimetableHeadway(selectedLine, tagesart, r),
                    fetchTimetableKPIs(selectedLine, tagesart)
                ]);

                setVolumeData(vol || []);
                setHeatmapData(heat || []);
                setHeadwayData(head || []);
                setKpiData(kpis || null);
            } catch (e) {
                console.error('Failed to load timetable data', e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedLine, tagesart, richtung]);

    const currentLineObj = lines.find((l) => l.line_no === selectedLine);

    // KPI Extraktion
    const totalTrips = kpiData ? kpiData.total_trips : 0;
    const firstTrip = kpiData ? formatTime(kpiData.first_trip_sec) : "—";
    const lastTrip = kpiData ? formatTime(kpiData.last_trip_sec) : "—";
    const symmetry = kpiData && kpiData.symmetry ? kpiData.symmetry : {};
    const symStr = Object.keys(symmetry).length > 0
        ? Object.entries(symmetry).map(([k, v]) => `${k.replace('Dir ', 'Ri ')}: ${v}`).join(' | ')
        : "—";

    const maxTrips = Math.max(...volumeData.map((d) => d.value || 0), 1);
    const peakHour = volumeData.reduce((max, d) => ((d.value || 0) > (max.value || 0) ? d : max), { label: '—', value: 0 });

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header & Filter Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-border-dark p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">
                            Fahrplan & Takt
                        </h2>
                        {currentLineObj && (
                            <p className="text-sm text-text-muted mt-0.5">
                                Linie {selectedLine} — {currentLineObj.line_text || ''}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex-1 md:flex-none">
                        <span className="material-symbols-outlined text-text-muted text-sm">route</span>
                        <select
                            value={selectedLine || ''}
                            onChange={(e) => setSelectedLine(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                        >
                            {lines.map((l) => (
                                <option key={l.line_no} value={l.line_no} className="bg-slate-800">
                                    Linie {l.line_no}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex-1 md:flex-none">
                        <span className="material-symbols-outlined text-text-muted text-sm">today</span>
                        <select
                            value={tagesart}
                            onChange={(e) => setTagesart(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                        >
                            {tagesartenOptionen.map((t) => (
                                <option key={t.abbr} value={t.abbr} className="bg-slate-800">
                                    {t.text}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex-1 md:flex-none">
                        <span className="material-symbols-outlined text-text-muted text-sm">swap_horiz</span>
                        <select
                            value={richtung}
                            onChange={(e) => setRichtung(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                        >
                            <option value="" className="bg-slate-800">Beide Richtungen</option>
                            <option value="1" className="bg-slate-800">Richtung 1</option>
                            <option value="2" className="bg-slate-800">Richtung 2</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                        Fahrten Gesamt
                    </span>
                    <span className="text-3xl font-black text-white">
                        {loading ? '...' : (totalTrips || 0).toLocaleString('de-DE')}
                    </span>
                </div>

                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                        Betriebszeitraum
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-emerald-400">{loading ? '...' : firstTrip}</span>
                        <span className="text-text-muted material-symbols-outlined text-sm">arrow_forward</span>
                        <span className="text-2xl font-black text-emerald-400">{loading ? '...' : lastTrip}</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                        Richtungssymmetrie
                    </span>
                    <span className="text-xl font-bold text-blue-400 truncate">
                        {loading ? '...' : symStr}
                    </span>
                </div>

                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl flex flex-col justify-center">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                        Spitzenfrequenz (Volume)
                    </span>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white">{loading ? '...' : peakHour.value}</span>
                        <span className="text-sm text-text-muted mb-1 font-medium">
                            {loading ? '' : `Fahrten um ${peakHour.label}:00`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Takt-Heatmap (Left, spans 2 cols on wide screens) */}
                <div className="lg:col-span-2 bg-slate-900 border border-border-dark rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">grid_on</span>
                            Takt-Matrix (Fahrten pro Stunde & Richtung)
                        </h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Lade Daten...</div>
                    ) : heatmapData.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Keine Daten verfügbar</div>
                    ) : (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                    <XAxis
                                        type="number"
                                        dataKey="hour"
                                        name="Stunde"
                                        domain={[0, 26]}
                                        tickFormatter={(t) => `${t >= 24 ? t - 24 : t}:00`}
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickCount={14}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="direction"
                                        name="Richtung"
                                        domain={[0, 3]}
                                        tickFormatter={(t) => t === 1 || t === 2 ? `Ri ${t}` : ''}
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickCount={4}
                                    />
                                    <ZAxis type="number" dataKey="trip_count" range={[50, 600]} name="Fahrten" />
                                    <RechartsTooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                                                        <p className="text-white font-medium mb-1">
                                                            {data.hour >= 24 ? data.hour - 24 : data.hour}:00, Richtung {data.direction}
                                                        </p>
                                                        <p className="text-emerald-400 font-bold">{data.trip_count} Fahrten</p>
                                                        <p className="text-slate-400 text-xs mt-1">{data.tagesart}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Fahrten Heatmap" data={heatmapData} fill="#10b981">
                                        {heatmapData.map((entry, index) => {
                                            // Optional: Color intensity based on count
                                            const opacity = Math.min(1, 0.4 + (entry.trip_count / 15));
                                            return <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={opacity} />;
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Route Variants Donut (Right) */}
                <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-md font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">alt_route</span>
                            Linienweg-Varianten
                        </h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Lade Daten...</div>
                    ) : !kpiData || !kpiData.routes || kpiData.routes.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Keine Varianten verfügbar</div>
                    ) : (
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={kpiData.routes}
                                        cx="50%"
                                        cy="50%"
                                        nameKey="route_hash"
                                        dataKey="count"
                                        innerRadius={60}
                                        outerRadius={85}
                                        stroke="#0f172a"
                                        strokeWidth={3}
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                    >
                                        {kpiData.routes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={CustomTooltip} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest mt-1">Varianten</span>
                                <span className="text-xl font-black text-white">{kpiData.routes.length}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Headway Distribution (Full Width) */}
                <div className="lg:col-span-3 bg-slate-900 border border-border-dark rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400">equalizer</span>
                            Takt-Treuendiagramm (Headway Distribution)
                        </h3>
                        <p className="text-xs text-text-muted">Anzahl Fahrten gruppiert nach Minuten-Abstand zur Vorfahrt</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Lade Daten...</div>
                    ) : headwayData.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-text-muted">Keine Daten verfügbar</div>
                    ) : (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={headwayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="headway"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(t) => `${t} min`}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                                                        <p className="text-slate-300 text-sm mb-1 font-medium">Takt: {label} Minuten</p>
                                                        <p className="text-blue-400 font-bold text-lg">
                                                            {payload[0].value} Fahrten
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {headwayData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={'#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
