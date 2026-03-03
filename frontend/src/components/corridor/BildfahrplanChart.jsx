import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchCorridorBildfahrplan } from '../../api';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
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
    if (sec == null || isNaN(sec)) return '--:--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatFahrzeit = (sec) => {
    if (sec == null || isNaN(sec)) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m} Min`;
    return `${m} Min ${s}s`;
};

const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 3600 + m * 60;
};

// Custom Tooltip removed, now using local state overlay in the main component.

export default function BildfahrplanChart({
    startStopId,
    endStopId,
    tagesart,
    showDepotRuns = true,
    hiddenLines,
    setHiddenLines,
    globalTimeFrom,
    setGlobalTimeFrom,
    globalTimeTo,
    setGlobalTimeTo
}) {
    // === ALL HOOKS BEFORE EARLY RETURNS ===
    const [trips, setTrips] = useState([]);
    const [stopsDict, setStopsDict] = useState({});
    const [loading, setLoading] = useState(false);

    // Controls state
    const [brushIndex, setBrushIndex] = useState({ startIndex: 0, endIndex: 0 });
    const [tooltip, setTooltip] = useState(null);

    // Line Filter state (now managed globally via hiddenLines)
    const [availableLines, setAvailableLines] = useState([]);

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

                // Extract unique lines for filter
                const uniqueLines = Array.from(new Set(fetchedTrips.map(t => String(t.li_no)))).sort();
                setAvailableLines(uniqueLines);

                // Calculate total korridor_fahrzeit for each trip
                fetchedTrips.forEach(t => {
                    const sortedPoints = [...t.points].sort((a, b) => a.li_lfd_nr - b.li_lfd_nr);
                    if (sortedPoints.length > 0) {
                        const firstPt = sortedPoints[0];
                        const lastPt = sortedPoints[sortedPoints.length - 1];

                        // Fallbacks: ankunft is typically the end time, abfahrt the start time.
                        const startTime = firstPt.abfahrt ?? firstPt.ankunft;
                        const endTime = lastPt.ankunft ?? lastPt.abfahrt;

                        if (startTime != null && endTime != null && endTime >= startTime) {
                            t.korridor_fahrzeit = endTime - startTime;
                        } else {
                            t.korridor_fahrzeit = null;
                        }
                    } else {
                        t.korridor_fahrzeit = null;
                    }
                });

                // Build Y-axis: group by stop_abbr instead of stop_id to avoid duplicates
                let longestTrip = fetchedTrips[0];
                fetchedTrips.forEach(t => {
                    if (!longestTrip || t.points.length > longestTrip.points.length) {
                        longestTrip = t;
                    }
                });

                const dict = {};
                if (longestTrip) {
                    let idx = 0;
                    longestTrip.points.forEach((pt) => {
                        const key = pt.stop_abbr || pt.stop_id;
                        if (!(key in dict)) {
                            dict[key] = { index: idx, text: pt.stop_text };
                            idx++;
                        }
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

    // Apply Line Filter
    const filteredTrips = useMemo(() => {
        if (!hiddenLines) return trips;
        return trips.filter(t => !hiddenLines.has(String(t.li_no)));
    }, [trips, hiddenLines]);

    const toggleLine = (lineNo) => {
        setHiddenLines?.(prev => {
            const next = new Set(prev);
            const strVal = String(lineNo);
            if (next.has(strVal)) {
                next.delete(strVal);
            } else {
                next.add(strVal);
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

    // Compute brushData from ALL trips so the timeline stays stable when filtering
    // Generate fixed 1-minute intervals for brush axis (Performance Optimization)
    const brushData = useMemo(() => {
        if (trips.length === 0) return [];

        let minTime = Infinity;
        let maxTime = -Infinity;

        trips.forEach(trip => {
            trip.points.forEach(p => {
                if (p.abfahrt != null) {
                    if (p.abfahrt < minTime) minTime = p.abfahrt;
                    if (p.abfahrt > maxTime) maxTime = p.abfahrt;
                }
            });
        });

        if (minTime === Infinity || maxTime === -Infinity) return [];

        // Floor to nearest minute for clean start
        let current = Math.floor(minTime / 60) * 60;
        const end = Math.ceil(maxTime / 60) * 60;

        const intervals = [];
        while (current <= end) {
            intervals.push({ x: current });
            current += 60; // 1-minute steps
        }

        return intervals;
    }, [trips]);

    // Setup brush limits based on new data or existing global time
    useEffect(() => {
        if (brushData.length > 0) {
            if (!globalTimeFrom && !globalTimeTo) {
                // Initial load: Set to full spectrum if no persistent time selected
                setBrushIndex({ startIndex: 0, endIndex: brushData.length - 1 });
                setGlobalTimeFrom?.(formatSeconds(brushData[0].x));
                setGlobalTimeTo?.(formatSeconds(brushData[brushData.length - 1].x));
            } else {
                // Restore persistent zoom from localStorage strings
                let startIdx = 0;
                let endIdx = brushData.length - 1;

                if (globalTimeFrom) {
                    const secFrom = parseTimeToSeconds(globalTimeFrom);
                    if (secFrom != null) {
                        let bestIdx = 0;
                        let bestDiff = Infinity;
                        brushData.forEach((d, i) => {
                            const diff = Math.abs(d.x - secFrom);
                            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
                        });
                        startIdx = bestIdx;
                    }
                }
                if (globalTimeTo) {
                    const secTo = parseTimeToSeconds(globalTimeTo);
                    if (secTo != null) {
                        let bestIdx = brushData.length - 1;
                        let bestDiff = Infinity;
                        brushData.forEach((d, i) => {
                            const diff = Math.abs(d.x - secTo);
                            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
                        });
                        endIdx = bestIdx;
                    }
                }
                setBrushIndex({ startIndex: startIdx, endIndex: endIdx });
            }
        }
    }, [brushData, globalTimeFrom, globalTimeTo, setGlobalTimeFrom, setGlobalTimeTo]);

    // Compute zoom domain
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

    // Compute Y-axis data
    const stopIndices = useMemo(() => {
        return Object.keys(stopsDict).map(k => stopsDict[k].index).sort((a, b) => b - a);
    }, [stopsDict]);
    const maxY = stopIndices.length > 0 ? Math.max(...stopIndices) : 0;

    const handleBrushChange = useCallback((e) => {
        if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
            setBrushIndex(prev => {
                if (prev.startIndex === e.startIndex && prev.endIndex === e.endIndex) return prev;
                return { startIndex: e.startIndex, endIndex: e.endIndex };
            });
            // Sync time fields globally
            if (brushData.length > 0) {
                const si = Math.min(e.startIndex, brushData.length - 1);
                const ei = Math.min(e.endIndex, brushData.length - 1);
                if (brushData[si]) setGlobalTimeFrom?.(formatSeconds(brushData[si].x));
                if (brushData[ei]) setGlobalTimeTo?.(formatSeconds(brushData[ei].x));
            }
        }
    }, [brushData, setGlobalTimeFrom, setGlobalTimeTo]);

    // Handle manual time input from UI fields
    const handleTimeFromChange = useCallback((value) => {
        setGlobalTimeFrom?.(value);
    }, [setGlobalTimeFrom]);

    const handleTimeToChange = useCallback((value) => {
        setGlobalTimeTo?.(value);
        if (sec != null && brushData.length > 0) {
            let bestIdx = brushData.length - 1;
            let bestDiff = Infinity;
            brushData.forEach((d, i) => {
                const diff = Math.abs(d.x - sec);
                if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
            });
            setBrushIndex(prev => ({ ...prev, endIndex: bestIdx }));
        }
    }, [brushData]);

    // === EARLY RETURNS ===
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

    return (
        <div className="flex flex-col h-full">
            {/* Control Header */}
            <div className="flex items-center gap-6 mb-3">
                {/* Time filter inputs */}
                <div className="flex items-center gap-4 bg-[#111318] px-3 py-1.5 rounded-lg border border-border-dark/50">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-sm">schedule</span>
                        <label className="text-xs text-slate-400">Von:</label>
                        <input
                            type="time"
                            value={globalTimeFrom || ''}
                            onChange={(e) => handleTimeFromChange(e.target.value)}
                            className="bg-transparent text-xs text-white w-20 outline-none font-mono"
                        />
                    </div>
                    <div className="w-px h-4 bg-border-dark"></div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Bis:</label>
                        <input
                            type="time"
                            value={globalTimeTo || ''}
                            onChange={(e) => handleTimeToChange(e.target.value)}
                            className="bg-transparent text-xs text-white w-20 outline-none font-mono"
                        />
                    </div>
                </div>

                {/* Line Filter Input (Pills) */}
                {availableLines.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 mr-1">Linien:</span>
                        <button
                            onClick={toggleAll}
                            className="px-2 py-1 text-xs rounded-full border border-border-dark bg-[#111318] hover:bg-surface text-text-muted transition-colors"
                        >
                            Alle / Keine
                        </button>
                        {availableLines.map(lineNo => {
                            const isVisible = !(hiddenLines?.has(lineNo));
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
                )}

                <span className="text-[10px] text-slate-500 ml-auto hidden md:block">Hovern für Details • Bildbereich kann per Schieber unten markiert werden</span>
            </div>

            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        margin={{ top: 10, right: 30, bottom: 20, left: 60 }}>
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
                                const stopKey = Object.keys(stopsDict).find(k => stopsDict[k].index === val);
                                return stopKey ? stopsDict[stopKey].text.substring(0, 15) : '';
                            }}
                        />
                        {/* Custom SVG circles implement their own HTML Tooltips below to bypass Recharts caching bugs */}

                        {/* Generate Line components directly here to ensure Recharts binds events correctly */}
                        {filteredTrips.map((trip) => {
                            const lineData = trip.points
                                .filter(p => {
                                    const key = p.stop_abbr || p.stop_id;
                                    return stopsDict[key] !== undefined;
                                })
                                .map(p => {
                                    const key = p.stop_abbr || p.stop_id;
                                    return {
                                        x: p.abfahrt,
                                        y: stopsDict[key].index,
                                        li_no: trip.li_no,
                                        is_depot_run: trip.is_depot_run,
                                        stop_text: p.stop_text,
                                        schedule_id: trip.schedule_id,
                                        richtung: trip.richtung,
                                        fahrt_start: trip.fahrt_start,
                                        fahrt_end: trip.fahrt_end,
                                        korridor_fahrzeit: trip.korridor_fahrzeit
                                    };
                                });

                            return (
                                <Line
                                    key={`line-${trip.schedule_id}`}
                                    type="linear"
                                    name={`Linie ${trip.li_no}${trip.is_depot_run ? ' (Depot)' : ''}`}
                                    data={lineData}
                                    dataKey="y"
                                    stroke={getColorForLine(trip.li_no)}
                                    // Make tooltip easier to trigger by having a thicker invisible hover area
                                    strokeWidth={trip.is_depot_run ? 2.0 : 2.5}
                                    strokeDasharray={trip.is_depot_run ? "5 5" : "0"}
                                    // Custom SVG Dots with manual mouse event bindings
                                    dot={(props) => {
                                        // Ignore empty points
                                        if (props.cx == null || props.cy == null) return null;
                                        return (
                                            <circle
                                                key={`${trip.schedule_id}-${props.index}`}
                                                cx={props.cx}
                                                cy={props.cy}
                                                r={3}
                                                fill={getColorForLine(trip.li_no)}
                                                opacity={0.8}
                                                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, data: props.payload })}
                                                onMouseLeave={() => setTooltip(null)}
                                            />
                                        );
                                    }}
                                    opacity={trip.is_depot_run ? 0.6 : 0.9}
                                    isAnimationActive={false}
                                />
                            );
                        })}

                        <Brush
                            data={brushData}
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
            </div>

            {/* Custom Tooltip Overlay rendered via standard React */}
            {tooltip && tooltip.data && (
                <div
                    className="fixed z-50 bg-[#111318] border border-border-dark p-3 rounded-xl shadow-xl min-w-[220px] pointer-events-none transition-opacity duration-150"
                    style={{ top: tooltip.y + 15, left: tooltip.x + 15, opacity: 1 }}
                >
                    <p className="text-white font-bold mb-2">{tooltip.data.stop_text}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <span className="text-slate-400">Zeit:</span>
                        <span className="font-bold text-white font-mono">{formatSeconds(tooltip.data.x)} Uhr</span>

                        <span className="text-slate-400">Linie:</span>
                        <span className="font-bold text-white px-2 py-0.5 rounded inline-block" style={{ backgroundColor: getColorForLine(tooltip.data.li_no) }}>
                            {tooltip.data.li_no}
                        </span>

                        <span className="text-slate-400">Fahrt-ID:</span>
                        <span className="text-white font-mono">{tooltip.data.schedule_id}</span>

                        {tooltip.data.richtung != null && (
                            <>
                                <span className="text-slate-400">Richtung:</span>
                                <span className="text-white">{tooltip.data.richtung === 1 ? 'Hin' : tooltip.data.richtung === 2 ? 'Rück' : tooltip.data.richtung}</span>
                            </>
                        )}

                        {tooltip.data.korridor_fahrzeit != null && (
                            <>
                                <span className="text-slate-400 mt-1 border-t border-border-dark pt-1">Korridor-Fahrzeit:</span>
                                <span className="text-primary mt-1 border-t border-border-dark pt-1 font-bold">{formatFahrzeit(tooltip.data.korridor_fahrzeit)}</span>
                            </>
                        )}

                        {tooltip.data.fahrt_start && (
                            <>
                                <span className="text-slate-400 mt-1">Von:</span>
                                <span className="text-primary/80 mt-1 text-[10px] leading-tight flex items-center">{tooltip.data.fahrt_start}</span>
                            </>
                        )}
                        {tooltip.data.fahrt_end && (
                            <>
                                <span className="text-slate-400">Nach:</span>
                                <span className="text-primary/80 text-[10px] leading-tight flex items-center">{tooltip.data.fahrt_end}</span>
                            </>
                        )}

                        {tooltip.data.is_depot_run && (
                            <>
                                <span className="text-slate-400 mt-1">Typ:</span>
                                <span className="text-amber-400 italic mt-1">Ein-/Aussetzer</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
