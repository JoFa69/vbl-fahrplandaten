import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorFrequency } from '../../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const getColorForLine = (lineNo) => {
    const palette = [
        "#3F83F8", "#FACA15", "#F05252", "#31C48D", "#9061F9",
        "#FF8A4C", "#E74694", "#8DA2B4", "#0E9F6E", "#1C64F2"
    ];
    let hash = 0;
    const str = String(lineNo);
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Only show lines that actually have trips > 0
        const validItems = payload.filter(item => {
            const val = item.payload[item.dataKey];
            return val != null && val > 0;
        });

        if (validItems.length === 0) return null;

        return (
            <div className="bg-[#111318] border border-border-dark p-3 rounded-xl shadow-xl relative z-[1000]">
                <p className="text-white font-bold mb-2 border-b border-border-dark pb-1 text-sm">{label} Uhr</p>
                <div className="flex flex-col gap-1.5">
                    {validItems.sort((a, b) => b.payload[b.dataKey] - a.payload[a.dataKey]).map((item, idx) => {
                        const val = item.payload[item.dataKey];
                        const nameStr = String(item.name);
                        const isDepot = nameStr.includes("_depot");
                        const lineName = isDepot ? nameStr.split('_')[0] : nameStr;
                        const color = item.fill && !item.fill.startsWith("url") ? item.fill : getColorForLine(lineName);

                        return (
                            <div key={idx} className="flex justify-between items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                                    <span className="text-slate-300 text-xs font-medium">
                                        Linie {lineName}
                                    </span>
                                    {isDepot && <span className="text-[10px] text-primary/70 italic -ml-1">(Ein-/Aussetzer)</span>}
                                </div>
                                <span className="font-bold text-white text-xs">
                                    {Number(val).toFixed(1)} <span className="text-slate-400 font-normal">Fahrten</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

// Use a nice color palette for lines
const LINE_COLORS = [
    "#3F83F8", // Blue
    "#FACA15", // Yellow
    "#F05252", // Red
    "#31C48D", // Green
    "#9061F9", // Purple
    "#FF8A4C", // Orange
    "#E74694", // Pink
    "#8DA2B4", // Slate
    "#0E9F6E", // Dark Green
    "#1C64F2"  // Dark Blue
];

export default function FrequencyChart({ stopId, tagesart, richtung, showDepotRuns = true }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorFrequency(stopId, tagesart, richtung);
                // raw response format: [{ std: 6, li_no: '1', trips_per_hour: 4.5 }, ...]
                setData(res || []);
            } catch (err) {
                console.error("Failed to load frequency data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung]);

    // Transform raw data into structured array for Recharts:
    // [{ std: "06:00", "Line 1": 4.5, "Line 2": 2 }, { std: "07:00", ... }]
    const { chartData, lines } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], lines: [] };

        // Find all unique lines
        const uniqueLines = [...new Set(data.map(d => d.li_no))].sort();

        // Group by hour
        const grouped = {};
        data.forEach(item => {
            if (!showDepotRuns && item.is_depot_run) return;

            const h = item.std;
            if (!grouped[h]) {
                grouped[h] = { hourNum: h, stdLabel: `${String(h).padStart(2, '0')}:00` };
            }
            if (item.is_depot_run) {
                grouped[h][`${item.li_no}_depot`] = item.trips_per_hour;
            } else {
                grouped[h][item.li_no] = item.trips_per_hour;
            }
        });

        // Sort by hour
        const sortedArray = Object.values(grouped).sort((a, b) => a.hourNum - b.hourNum);

        return { chartData: sortedArray, lines: uniqueLines };
    }, [data, showDepotRuns]);

    if (!stopId) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted text-sm border-2 border-dashed border-border-dark rounded-xl">
                Bitte Knotenpunkt auswählen
            </div>
        );
    }

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
                Keine Fahrten für diese Auswahl gefunden.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
            >
                <defs>
                    {lines.map((lineNo, index) => {
                        const color = LINE_COLORS[index % LINE_COLORS.length];
                        return (
                            <pattern key={`pattern_depot_${lineNo}`} id={`pattern_depot_${lineNo}`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                <rect width="8" height="8" fill={color} fillOpacity="0.1" />
                                <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="4" />
                            </pattern>
                        );
                    })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                    dataKey="stdLabel"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(val) => Math.round(val)}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: '#374151', opacity: 0.4 }}
                    wrapperStyle={{ zIndex: 1000, outline: 'none' }}
                />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => value.includes("_depot") ? `Linie ${value.split('_')[0]} (Ein-/Aussetzer)` : `Linie ${value}`}
                />

                {lines.map((lineNo, index) => (
                    <React.Fragment key={`fragment-${lineNo}`}>
                        <Bar
                            key={lineNo}
                            dataKey={lineNo}
                            stackId="a"
                            fill={LINE_COLORS[index % LINE_COLORS.length]}
                            name={lineNo}
                        />
                        <Bar
                            key={`${lineNo}_depot`}
                            dataKey={`${lineNo}_depot`}
                            stackId="a"
                            fill={`url(#pattern_depot_${lineNo})`}
                            name={`${lineNo}_depot`}
                        />
                    </React.Fragment>
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
