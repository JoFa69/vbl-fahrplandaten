import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorHeadway } from '../../api';
import {
    ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Brush, ReferenceArea, ReferenceLine, Cell
} from 'recharts';

// Custom Tooltip for Headway Chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#111318]/95 backdrop-blur-md border border-border-dark p-4 rounded-xl shadow-xl shadow-black">
                <p className="text-white font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    {data.time_label} Uhr
                </p>
                <div className="flex flex-col gap-1 mt-3">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400 text-xs">Zeitabstand zum Vorfahrer:</span>
                        <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 rounded">
                            {data.headway_minutes} Min
                        </span>
                    </div>
                    {data.ma5 != null && (
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-slate-400 text-xs">Ø Gleitender Durchschnitt:</span>
                            <span className="text-amber-400 font-mono font-bold text-sm bg-amber-500/10 px-2 rounded">
                                {data.ma5.toFixed(1)} Min
                            </span>
                        </div>
                    )}
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

export default function HeadwayChart({ stopId, tagesart, richtung, showDepotRuns = true, targetHeadway = 10, tolerance = 2 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorHeadway(stopId, tagesart, richtung);
                let safeData = res || [];

                if (!showDepotRuns) {
                    safeData = safeData.filter(d => !d.is_depot_run);
                    for (let i = 1; i < safeData.length; i++) {
                        safeData[i].headway_minutes = Math.floor((safeData[i].abfahrt - safeData[i - 1].abfahrt) / 60);
                    }
                }

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

    // Compute moving average (window 5)
    const enrichedData = useMemo(() => {
        if (data.length === 0) return [];
        const windowSize = 5;
        return data.map((d, i) => {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
            const slice = data.slice(start, end);
            const avg = slice.reduce((s, v) => s + v.headway_minutes, 0) / slice.length;
            return { ...d, ma5: avg };
        });
    }, [data]);

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
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={enrichedData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

                    {/* Target Corridor Band */}
                    <ReferenceArea
                        y1={Math.max(0, targetHeadway - tolerance)}
                        y2={targetHeadway + tolerance}
                        fill="#10B981"
                        fillOpacity={0.12}
                        strokeOpacity={0}
                    />

                    {/* Soll-Takt Reference Line (gestrichelt) */}
                    <ReferenceLine
                        y={targetHeadway}
                        stroke="#10B981"
                        strokeDasharray="6 4"
                        strokeWidth={2}
                        label={{
                            value: `Soll: ${targetHeadway} Min`,
                            position: 'right',
                            fill: '#10B981',
                            fontSize: 11,
                            fontWeight: 'bold'
                        }}
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

                    {/* Moving Average Line (smooth trend) */}
                    <Line
                        type="monotone"
                        dataKey="ma5"
                        stroke="#FBBF24"
                        strokeWidth={2}
                        dot={false}
                        name="Ø Gleitender Durchschnitt"
                        strokeOpacity={0.8}
                    />

                    {/* Actual data points as colored dots */}
                    <Scatter dataKey="headway_minutes" name="Taktzeit">
                        {enrichedData.map((entry, index) => {
                            const isOutside = Math.abs(entry.headway_minutes - targetHeadway) > tolerance;
                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isOutside ? '#EF4444' : '#10B981'}
                                    r={3}
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
