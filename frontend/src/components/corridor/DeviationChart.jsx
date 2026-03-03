import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorHeadway } from '../../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        const dev = d.deviation;
        const color = dev > 0 ? '#EF4444' : '#3B82F6';
        const label = dev > 0 ? 'Zu spät / Lücke' : 'Zu früh / Pulk';
        return (
            <div className="bg-[#111318]/95 backdrop-blur-md border border-border-dark p-4 rounded-xl shadow-xl shadow-black">
                <p className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    {d.time_label} Uhr
                </p>
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400">Ist-Takt:</span>
                        <span className="text-white font-mono font-bold">{d.headway_minutes} Min</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400">Soll-Takt:</span>
                        <span className="text-white font-mono">{d.target} Min</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 mt-1 border-t border-border-dark pt-1">
                        <span className="text-slate-400">Abweichung:</span>
                        <span className="font-mono font-bold" style={{ color }}>
                            {dev > 0 ? '+' : ''}{dev.toFixed(1)} Min ({label})
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400">Linie:</span>
                        <span className="text-primary font-bold">{d.li_no}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function DeviationChart({ stopId, tagesart, richtung, showDepotRuns = true, targetHeadway = 10 }) {
    const [rawData, setRawData] = useState([]);
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
                setRawData(safeData);
            } catch (err) {
                console.error("Failed to load deviation data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung, showDepotRuns]);

    const chartData = useMemo(() => {
        return rawData.map(d => ({
            ...d,
            deviation: d.headway_minutes - targetHeadway,
            target: targetHeadway,
        }));
    }, [rawData, targetHeadway]);

    if (!stopId) return null;

    if (loading) {
        return (
            <div className="h-full flex justify-center items-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Keine Daten für Abweichungsanalyse verfügbar.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

                <XAxis
                    dataKey="time_label"
                    stroke="#9CA3AF"
                    minTickGap={50}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    label={{ value: 'Abweichung (Min)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                />

                {/* Zero line = perfect headway */}
                <ReferenceLine
                    y={0}
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                        value: `Soll: ${targetHeadway} Min`,
                        position: 'right',
                        fill: '#10B981',
                        fontSize: 11,
                        fontWeight: 'bold'
                    }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.3 }} />

                <Bar dataKey="deviation" name="Abweichung" maxBarSize={6}>
                    {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.deviation >= 0 ? '#EF4444' : '#3B82F6'}
                            fillOpacity={0.8}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
