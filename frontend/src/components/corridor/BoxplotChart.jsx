import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorHeadway } from '../../api';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar
} from 'recharts';

// Custom box shape for the boxplot
const BoxPlotShape = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;

    const chartArea = props; // contains x, y, width, height

    return null; // We use Bar + ErrorBar instead
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-[#111318]/95 backdrop-blur-md border border-border-dark p-4 rounded-xl shadow-xl shadow-black">
                <p className="text-white font-bold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    {d.label}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-slate-400">Maximum:</span>
                    <span className="text-white font-mono">{d.max?.toFixed(1)} Min</span>
                    <span className="text-slate-400">75. Perzentil (Q3):</span>
                    <span className="text-white font-mono">{d.q3?.toFixed(1)} Min</span>
                    <span className="text-slate-400">Median:</span>
                    <span className="text-amber-400 font-mono font-bold">{d.median?.toFixed(1)} Min</span>
                    <span className="text-slate-400">25. Perzentil (Q1):</span>
                    <span className="text-white font-mono">{d.q1?.toFixed(1)} Min</span>
                    <span className="text-slate-400">Minimum:</span>
                    <span className="text-white font-mono">{d.min?.toFixed(1)} Min</span>
                    <span className="text-slate-400 mt-1 border-t border-border-dark pt-1">Fahrten:</span>
                    <span className="text-primary font-mono mt-1 border-t border-border-dark pt-1">{d.count}</span>
                </div>
            </div>
        );
    }
    return null;
};

function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// Custom rendered box shape for each bar
const renderBoxShape = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload || !payload.q1 || !payload.q3) return null;

    // The bar renders the IQR (q1 to q3)
    // We add whisker lines for min and max
    const midX = x + width / 2;

    // We need to figure out the y scale. The bar y and height represent q1 to q3.
    // For whiskers, we'll use ErrorBar instead.

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={props.fill} rx={3} opacity={0.85} />
            {/* Median line */}
            {payload.medianY != null && (
                <line
                    x1={x + 2}
                    x2={x + width - 2}
                    y1={payload.medianY}
                    y2={payload.medianY}
                    stroke="#FBBF24"
                    strokeWidth={2.5}
                />
            )}
        </g>
    );
};

export default function BoxplotChart({ stopId, tagesart, richtung, showDepotRuns = true, targetHeadway = 10, tolerance = 2 }) {
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
                console.error("Failed to load boxplot data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung, showDepotRuns]);

    // Aggregate data by hour into boxplot statistics
    const boxData = useMemo(() => {
        if (rawData.length === 0) return [];

        const grouped = {};
        rawData.forEach(d => {
            const h = d.std;
            if (!grouped[h]) grouped[h] = [];
            grouped[h].push(d.headway_minutes);
        });

        return Object.entries(grouped)
            .map(([hour, values]) => {
                const h = Number(hour);
                const q1 = percentile(values, 25);
                const q3 = percentile(values, 75);
                const med = percentile(values, 50);
                const minVal = Math.min(...values);
                const maxVal = Math.max(...values);
                const iqr = q3 - q1;

                // Color based on IQR stability
                let color = '#10B981'; // green = stable
                if (iqr > tolerance * 2) color = '#EF4444'; // red = chaotic
                else if (iqr > tolerance) color = '#FBBF24'; // yellow = moderate

                return {
                    hour: h,
                    label: `${String(h).padStart(2, '0')}:00`,
                    q1,
                    q3,
                    median: med,
                    min: minVal,
                    max: maxVal,
                    iqr,
                    count: values.length,
                    // For Recharts Bar: the bar bottom is q1, height is IQR
                    barBottom: q1,
                    barHeight: iqr,
                    // Error bars for whiskers
                    whiskerUp: maxVal - q3,
                    whiskerDown: q1 - minVal,
                    color,
                };
            })
            .sort((a, b) => a.hour - b.hour);
    }, [rawData, tolerance]);

    if (!stopId) return null;

    if (loading) {
        return (
            <div className="h-full flex justify-center items-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (boxData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Keine Daten für Boxplot-Darstellung verfügbar.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={boxData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

                {/* Soll-Takt corridor */}
                <XAxis
                    dataKey="label"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    label={{ value: 'Taktzeit (Min)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.3 }} />

                {/* Box: stacked bar from q1 to q3 */}
                {/* Invisible base bar up to q1 */}
                <Bar dataKey="barBottom" stackId="box" fill="transparent" isAnimationActive={false} />
                {/* Visible IQR box */}
                <Bar dataKey="barHeight" stackId="box" isAnimationActive={false} radius={[4, 4, 4, 4]}>
                    {boxData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1} />
                    ))}
                    <ErrorBar dataKey="whiskerUp" direction="y" width={12} stroke="#9CA3AF" strokeWidth={1.5} />
                </Bar>

                {/* Median line rendered as a scatter with custom shape */}
                {boxData.map((d, i) => (
                    <line key={`median-${i}`} />
                ))}
            </ComposedChart>
        </ResponsiveContainer>
    );
}
