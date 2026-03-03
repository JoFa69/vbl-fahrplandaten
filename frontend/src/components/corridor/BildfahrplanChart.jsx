import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorBildfahrplan } from '../../api';
import {
    ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
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

const formatSeconds = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#111318] border border-border-dark p-3 rounded-xl shadow-xl">
                <p className="text-white font-bold mb-1">{data.stop_text}</p>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-slate-400 text-xs">Zeit:</span>
                    <span className="font-bold text-white text-sm">{formatSeconds(data.x)} Uhr</span>
                </div>
                <div className="flex justify-between items-center gap-4 mt-1 border-t border-border-dark pt-1">
                    <span className="text-slate-400 text-xs">Linie:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white px-2 py-0.5 rounded text-xs" style={{ backgroundColor: getColorForLine(data.li_no) }}>
                            {data.li_no}
                        </span>
                        {data.is_depot_run && <span className="text-[10px] text-primary/70 italic">Ein-/Aussetzer</span>}
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function BildfahrplanChart({ startStopId, endStopId, tagesart, showDepotRuns = true }) {
    // === ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS ===
    const [trips, setTrips] = useState([]);
    const [stopsDict, setStopsDict] = useState({});
    const [loading, setLoading] = useState(false);
    const [brushIndex, setBrushIndex] = useState({ startIndex: 0, endIndex: 0 });

    useEffect(() => {
        if (!startStopId || !endStopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorBildfahrplan(startStopId, endStopId, tagesart);
                let fetchedTrips = res.trips || [];

                if (!showDepotRuns) {
                    fetchedTrips = fetchedTrips.filter(t => !t.is_depot_run);
                }

                // We need a uniform vertical axis: the sequence of stops.
                // We map all unique stops from all trips by their order.
                // It's a heuristic: we grab the longest trip to determine the stop sequence.
                let longestTrip = fetchedTrips[0];
                fetchedTrips.forEach(t => {
                    if (!longestTrip || t.points.length > longestTrip.points.length) {
                        longestTrip = t;
                    }
                });

                const dict = {};
                if (longestTrip) {
                    longestTrip.points.forEach((pt, index) => {
                        dict[pt.stop_id] = { index, text: pt.stop_text };
                    });
                }

                setStopsDict(dict);
                setTrips(fetchedTrips);
            } catch (err) {
                console.error("Failed to load bildfahrplan", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [startStopId, endStopId, tagesart, showDepotRuns]);

    // Compute brushData from trips
    const brushData = useMemo(() => {
        if (trips.length === 0) return [];
        const allIntervals = new Set();
        trips.forEach(trip => {
            trip.points.forEach(p => {
                if (p.abfahrt != null) allIntervals.add(p.abfahrt);
            });
        });
        return Array.from(allIntervals).sort((a, b) => a - b).map(val => ({ x: val }));
    }, [trips]);

    // Reset brush indices when brushData changes
    useEffect(() => {
        if (brushData.length > 0) {
            setBrushIndex({ startIndex: 0, endIndex: brushData.length - 1 });
        }
    }, [brushData]);

    // Compute zoom domain from brush indices
    const zoomDomain = useMemo(() => {
        if (brushData.length > 0) {
            const startIdx = Math.min(brushIndex.startIndex || 0, brushData.length - 1);
            const endIdx = Math.min(brushIndex.endIndex || 0, brushData.length - 1);
            const start = brushData[startIdx];
            const end = brushData[endIdx];

            if (startIdx === 0 && endIdx === brushData.length - 1) {
                return ['dataMin - 600', 'dataMax + 600'];
            }
            if (start && end) {
                return [start.x, end.x];
            }
        }
        return ['dataMin - 600', 'dataMax + 600'];
    }, [brushData, brushIndex]);

    // Compute display data
    const stopIndices = useMemo(() => {
        return Object.keys(stopsDict).map(k => stopsDict[k].index).sort((a, b) => b - a);
    }, [stopsDict]);
    const maxY = stopIndices.length > 0 ? Math.max(...stopIndices) : 0;

    // === EARLY RETURNS (after all hooks) ===
    if (!startStopId || !endStopId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-border-dark rounded-xl bg-surface-dark/50">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">swap_calls</span>
                Bitte Start- und Ziel-Haltestelle definieren.
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

    if (trips.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Keine Direktverbindungen für diese Auswahl gefunden.
            </div>
        );
    }

    const handleBrushChange = (e) => {
        if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
            setBrushIndex(prev => {
                if (prev.startIndex === e.startIndex && prev.endIndex === e.endIndex) return prev;
                return { startIndex: e.startIndex, endIndex: e.endIndex };
            });
        }
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={brushData} margin={{ top: 20, right: 30, bottom: 20, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                    type="number"
                    dataKey="x"
                    name="Zeit"
                    domain={zoomDomain}
                    allowDataOverflow={true}
                    tickCount={24}
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(val) => formatSeconds(val)}
                />
                <YAxis
                    type="number"
                    dataKey="y"
                    name="Haltestelle"
                    domain={[0, maxY]}
                    reversed={true}
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickCount={stopIndices.length || 1}
                    tickFormatter={(val) => {
                        const stopId = Object.keys(stopsDict).find(k => stopsDict[k].index === val);
                        return stopId ? stopsDict[stopId].text.substring(0, 15) : '';
                    }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                {trips.map((trip) => {
                    const lineData = trip.points
                        .filter(p => stopsDict[p.stop_id] !== undefined)
                        .map(p => ({
                            x: p.abfahrt,
                            y: stopsDict[p.stop_id].index,
                            li_no: trip.li_no,
                            is_depot_run: trip.is_depot_run,
                            stop_text: p.stop_text
                        }));

                    return (
                        <Scatter
                            key={trip.schedule_id}
                            name={`Linie ${trip.li_no}${trip.is_depot_run ? ' (Depot)' : ''}`}
                            data={lineData}
                            line={{
                                stroke: getColorForLine(trip.li_no),
                                strokeWidth: trip.is_depot_run ? 1.0 : 1.5,
                                strokeDasharray: trip.is_depot_run ? "5 5" : "0"
                            }}
                            shape="circle"
                            fill={getColorForLine(trip.li_no)}
                            opacity={trip.is_depot_run ? 0.6 : 1.0}
                            r={trip.is_depot_run ? 1.0 : 1.5}
                        />
                    );
                })}

                <Brush
                    dataKey="x"
                    height={30}
                    stroke="#9CA3AF"
                    fill="#111318"
                    tickFormatter={(val) => formatSeconds(val)}
                    onChange={handleBrushChange}
                    startIndex={brushIndex.startIndex}
                    endIndex={brushIndex.endIndex}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
