import React, { useState, useEffect } from 'react';
import { fetchCorridorHeadway } from '../../api';
import {
    ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceArea, Cell
} from 'recharts';

// Custom Tooltip for Headway Chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#111318]/95 backdrop-blur-md border border-border-dark p-4 rounded-xl shadow-xl shadow-black">
                <p className="text-white font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    {label} Uhr
                </p>
                <div className="flex flex-col gap-1 mt-3">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400 text-xs">Zeitabstand zum Vorfahrer:</span>
                        <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 rounded">
                            {data.headway_minutes} Min
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4 mt-1 border-t border-border-dark pt-2">
                        <span className="text-slate-400 text-xs">Gehört zu Linie:</span>
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold border border-primary/30">
                            {data.li_no}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function HeadwayChart({ stopId, tagesart, richtung, showDepotRuns = true }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Target corridor states
    const [targetHeadway, setTargetHeadway] = useState(10);
    const [tolerance, setTolerance] = useState(2);

    useEffect(() => {
        if (!stopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorHeadway(stopId, tagesart, richtung);
                // raw response format: [{ time_label: "06:40", std: 6, h_min: 40, li_no: "20", headway_minutes: 8 }, ...]

                let safeData = res || [];

                if (!showDepotRuns) {
                    safeData = safeData.filter(d => !d.is_depot_run);
                    // Recalculate headways since gaps between buses have changed!
                    for (let i = 1; i < safeData.length; i++) {
                        safeData[i].headway_minutes = Math.floor((safeData[i].abfahrt - safeData[i - 1].abfahrt) / 60);
                    }
                }

                // Let's filter out ridiculous headways (e.g. over 120 minutes, like first bus of the day vs last of yesterday)
                safeData = safeData.filter(d => d.headway_minutes != null && d.headway_minutes >= 0 && d.headway_minutes <= 120);

                setData(safeData);
            } catch (err) {
                console.error("Failed to load headway data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung, showDepotRuns]);

    if (!stopId) return null;

    if (loading) {
        return (
            <div className="h-full flex justify-center items-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Kein zusammenhängender Takt-Verlauf gefunden.
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Controls for Target Corridor */}
            <div className="flex justify-end items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Soll-Takt (Min):</label>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={targetHeadway}
                        onChange={(e) => setTargetHeadway(Number(e.target.value))}
                        className="bg-surface border border-border-dark rounded px-2 py-1 text-xs text-white w-16 outline-none focus:border-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Toleranz (± Min):</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="bg-surface border border-border-dark rounded px-2 py-1 text-xs text-white w-16 outline-none focus:border-primary"
                    />
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

                    {/* Target Corridor Band */}
                    <ReferenceArea
                        y1={Math.max(0, targetHeadway - tolerance)}
                        y2={targetHeadway + tolerance}
                        fill="#10B981"
                        fillOpacity={0.15}
                        strokeOpacity={0}
                    />

                    {/* Target Line */}
                    <ReferenceArea
                        y1={targetHeadway}
                        y2={targetHeadway}
                        stroke="#10B981"
                        strokeDasharray="3 3"
                        strokeOpacity={0.6}
                    />

                    <XAxis
                        dataKey="time_label"
                        stroke="#9CA3AF"
                        minTickGap={50}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickMargin={10}
                    />

                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        label={{ value: 'Wartezeit (Min)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4B5563', strokeWidth: 1, strokeDasharray: '4 4' }} />

                    <Scatter dataKey="headway_minutes">
                        {data.map((entry, index) => {
                            const isOutside = Math.abs(entry.headway_minutes - targetHeadway) > tolerance;
                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isOutside ? '#EF4444' : '#10B981'}
                                />
                            );
                        })}
                    </Scatter>

                    <Brush
                        dataKey="time_label"
                        height={30}
                        stroke="#9CA3AF"
                        fill="#111318"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
