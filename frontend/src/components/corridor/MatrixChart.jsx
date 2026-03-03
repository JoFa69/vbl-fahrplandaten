import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorMatrix } from '../../api';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceArea
} from 'recharts';

const LINE_COLORS = {
    // We deterministically assign colors to lines based on their name hash
};

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

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#111318] border border-border-dark p-3 rounded-lg shadow-xl">
                <p className="text-white font-bold mb-1">
                    {String(data.std).padStart(2, '0')}:{String(data.original_min).padStart(2, '0')} Uhr
                </p>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-400 text-xs">Linie:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white px-2 py-0.5 rounded text-xs" style={{ backgroundColor: getColorForLine(data.li_no) }}>
                                {data.li_no}
                            </span>
                            {data.is_depot_run && <span className="text-[10px] text-primary/70 italic">Ein-/Aussetzer</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Custom shape for scatter points (rounded squares look more like a matrix table)
const CustomDot = (props) => {
    const { cx, cy, fill, payload } = props;
    if (cx == null || cy == null) return null;

    if (payload && payload.is_depot_run) {
        return (
            <g transform={`translate(${cx},${cy})`}>
                <rect x={-4} y={-4} width={8} height={8} rx={1} fill={fill} fillOpacity={0.4} stroke="#111318" strokeWidth={1} />
                <line x1={-4} y1={-4} x2={4} y2={4} stroke={fill} strokeWidth={1.5} />
            </g>
        );
    }

    return (
        <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={2} fill={fill} stroke="#111318" strokeWidth={1} />
    );
};

export default function MatrixChart({ stopId, tagesart, richtung, showDepotRuns = true, hiddenLines, setHiddenLines }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorMatrix(stopId, tagesart, richtung);
                // raw response format: [{ li_no: "20", richtung: 1, std: 6, h_min: 40, days_active: 1 }, ...]
                setData(res || []);
            } catch (err) {
                console.error("Failed to load matrix data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung]);

    // Group elements by line so Recharts shows them separately in the Legend
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(item => {
            if (!showDepotRuns && item.is_depot_run) return;
            if (hiddenLines.has(item.li_no)) return;

            if (!groups[item.li_no]) groups[item.li_no] = [];
            // Add slight jitter on the y-axis (std) so same-minute departures don't totally obscure each other
            const lineIndex = Object.keys(groups).indexOf(String(item.li_no));
            const yOffset = (lineIndex * 0.15);

            groups[item.li_no].push({
                ...item,
                original_min: item.h_min,
                // Y-Axis: hour, plus offset, inverted so 0 is at bottom but hour 6 is below hour 7 naturally in scatter
                plot_y: item.std + yOffset,
                plot_x: item.h_min
            });
        });
        return groups;
    }, [data, showDepotRuns, hiddenLines]);

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
                Keine Abfahrten zur Visualisierung gefunden.
            </div>
        );
    }

    const availableLines = [...new Set(data.map(d => d.li_no))].sort();
    const visibleGroups = Object.keys(groupedData).sort();

    // Generate minute shading intervals (e.g. 0-10, 20-30, 40-50)
    const minuteShading = [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
        { start: 40, end: 50 },
    ];

    const toggleLine = (lineNo) => {
        setHiddenLines(prev => {
            const next = new Set(prev);
            if (next.has(lineNo)) {
                next.delete(lineNo);
            } else {
                next.add(lineNo);
            }
            return next;
        });
    };

    const toggleAll = () => {
        const visibleCount = availableLines.filter(l => !hiddenLines?.has(String(l))).length;
        if (visibleCount < availableLines.length) {
            // Show all current lines
            setHiddenLines?.(prev => {
                const next = new Set(prev);
                availableLines.forEach(l => next.delete(String(l)));
                return next;
            });
        } else {
            // Hide all current lines
            setHiddenLines?.(prev => {
                const next = new Set(prev);
                availableLines.forEach(l => next.add(String(l)));
                return next;
            });
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Line Filter Toggles */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center items-center">
                <span className="text-xs text-slate-400 mr-2">Linien filtern:</span>
                <button
                    onClick={toggleAll}
                    className="px-2 py-1 text-xs rounded-full border border-border-dark bg-surface hover:bg-surface-light text-text-muted transition-colors mr-2"
                >
                    Alle / Keine
                </button>
                {availableLines.map(lineNo => {
                    const isVisible = !hiddenLines.has(lineNo);
                    const color = getColorForLine(lineNo);
                    return (
                        <button
                            key={lineNo}
                            onClick={() => toggleLine(lineNo)}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5`}
                            style={{
                                backgroundColor: isVisible ? `${color}30` : 'transparent',
                                color: isVisible ? color : '#9CA3AF',
                                border: `1px solid ${isVisible ? color : '#4B5563'}`
                            }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isVisible ? color : '#4B5563' }}></span>
                            {lineNo}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        {minuteShading.map((interval, i) => (
                            <ReferenceArea
                                key={`ref-${i}`}
                                x1={interval.start}
                                x2={interval.end}
                                fill="#374151"
                                fillOpacity={0.2}
                                strokeOpacity={0}
                            />
                        ))}

                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            type="number"
                            dataKey="plot_x"
                            name="Minute"
                            domain={[0, 59]}
                            tickCount={12}
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(val) => `${val}m`}
                        />
                        <YAxis
                            type="number"
                            dataKey="plot_y"
                            name="Stunde"
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tickCount={24}
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(val) => `${Math.floor(val)}:00`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {visibleGroups.map((lineNo) => (
                            <Scatter
                                key={lineNo}
                                name={`Linie ${lineNo}`}
                                data={groupedData[lineNo]}
                                fill={getColorForLine(lineNo)}
                                shape={<CustomDot />}
                            />
                        ))}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
