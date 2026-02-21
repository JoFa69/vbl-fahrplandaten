import React, { useState, useEffect } from 'react';
import { fetchVolumeMetrics, fetchLines } from '../api';

export default function FahrplanFrequenzPage() {
    const [lines, setLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [hourlyData, setHourlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLines() {
            try {
                const data = await fetchLines();
                setLines(data || []);
                if (data && data.length > 0) {
                    setSelectedLine(data[0].line_no);
                }
            } catch (e) {
                console.error('Failed to load lines', e);
            } finally {
                setLoading(false);
            }
        }
        loadLines();
    }, []);

    useEffect(() => {
        if (!selectedLine) return;
        async function loadHourlyData() {
            try {
                const data = await fetchVolumeMetrics(selectedLine, 'hour');
                setHourlyData(data || []);
            } catch (e) {
                console.error('Failed to load hourly data', e);
            }
        }
        loadHourlyData();
    }, [selectedLine]);

    const maxTrips = Math.max(...hourlyData.map((d) => d.value || 0), 1);
    const currentLineObj = lines.find((l) => l.line_no === selectedLine);
    const totalTrips = hourlyData.reduce((sum, d) => sum + (d.value || 0), 0);
    const peakHour = hourlyData.reduce((max, d) => ((d.value || 0) > (max.value || 0) ? d : max), { label: '—', value: 0 });
    const avgHeadway = totalTrips > 0 ? Math.round((18 * 60) / totalTrips) : 0;

    // Mock Gantt data
    const ganttBlocks = [
        { label: 'Fahrzeug 1', blocks: [{ start: 5, end: 10, color: 'bg-primary' }, { start: 12, end: 17, color: 'bg-primary' }, { start: 18, end: 22, color: 'bg-blue-400' }] },
        { label: 'Fahrzeug 2', blocks: [{ start: 6, end: 11, color: 'bg-emerald-500' }, { start: 13, end: 18, color: 'bg-emerald-500' }] },
        { label: 'Fahrzeug 3', blocks: [{ start: 7, end: 9, color: 'bg-amber-500' }, { start: 10, end: 15, color: 'bg-amber-500' }, { start: 16, end: 20, color: 'bg-amber-500' }] },
        { label: 'Fahrzeug 4', blocks: [{ start: 5, end: 8, color: 'bg-purple-500' }, { start: 14, end: 22, color: 'bg-purple-500' }] },
    ];

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                            Fahrplan & Frequenz
                        </h2>
                        {currentLineObj && (
                            <p className="text-sm text-text-muted mt-0.5">
                                Linie {selectedLine} — {currentLineObj.line_text || ''}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedLine || ''}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:ring-1 focus:ring-primary"
                    >
                        {lines.map((l) => (
                            <option key={l.line_no} value={l.line_no}>
                                Linie {l.line_no} — {l.line_text}
                            </option>
                        ))}
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Fahrten gesamt</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-black text-white">
                            {totalTrips.toLocaleString('de-DE')}
                        </span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Spitzenfrequenz</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-black text-white">{peakHour.value}</span>
                        <span className="text-sm text-text-muted mb-1 font-medium">
                            um {peakHour.label}:00
                        </span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-border-dark p-5 rounded-xl">
                    <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Ø Takt</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-black text-white">{avgHeadway}</span>
                        <span className="text-sm text-text-muted mb-1 font-medium">min</span>
                    </div>
                </div>
            </div>

            {/* Frequency Bar Chart */}
            <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted">bar_chart</span>
                    Fahrtenfrequenz nach Stunde
                </h3>
                {hourlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                        {loading ? 'Lade Daten...' : 'Wähle eine Linie aus'}
                    </div>
                ) : (
                    <div className="flex items-end gap-1.5 h-48">
                        {hourlyData.map((d, i) => {
                            const height = (d.value / maxTrips) * 100;
                            const isPeak = d.value === peakHour.value;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 flex flex-col items-center gap-1 group relative"
                                >
                                    <div className="w-full flex flex-col items-center justify-end h-40">
                                        <span className="text-[9px] font-bold text-text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {d.value}
                                        </span>
                                        <div
                                            className={`w-full rounded-t transition-all ${isPeak
                                                    ? 'bg-primary shadow-lg shadow-primary/30'
                                                    : 'bg-primary/60 group-hover:bg-primary'
                                                }`}
                                            style={{ height: `${height}%`, minHeight: d.value > 0 ? '4px' : '0' }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                                        {String(d.label).padStart(2, '0')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Gantt Timeline */}
            <div className="bg-slate-900 border border-border-dark rounded-xl p-6 pb-8">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted">view_timeline</span>
                    Fahrzeug-Taktung
                    <span className="text-[10px] font-normal text-text-muted ml-auto bg-slate-800 px-2 py-1 rounded">
                        Mock-Daten
                    </span>
                </h3>
                <div className="space-y-3">
                    {/* Time header */}
                    <div className="flex items-center gap-4 pl-24">
                        {Array.from({ length: 20 }, (_, i) => i + 4).map((h) => (
                            <div key={h} className="flex-1 text-center">
                                <span className="text-[9px] text-slate-500 font-medium">{String(h).padStart(2, '0')}</span>
                            </div>
                        ))}
                    </div>
                    {ganttBlocks.map((vehicle, vi) => (
                        <div key={vi} className="flex items-center gap-4">
                            <span className="text-xs text-slate-400 font-medium w-20 shrink-0 text-right">
                                {vehicle.label}
                            </span>
                            <div className="flex-1 h-6 bg-slate-800/50 rounded relative">
                                {vehicle.blocks.map((block, bi) => {
                                    const left = ((block.start - 4) / 20) * 100;
                                    const width = ((block.end - block.start) / 20) * 100;
                                    return (
                                        <div
                                            key={bi}
                                            className={`absolute top-0.5 bottom-0.5 rounded ${block.color} opacity-80 hover:opacity-100 transition-opacity`}
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
