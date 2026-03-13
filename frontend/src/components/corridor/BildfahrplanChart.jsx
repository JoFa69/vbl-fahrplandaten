import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchCorridorBildfahrplan } from '../../api';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    DataZoomComponent,
    LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register ECharts modules
echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent, CanvasRenderer]);

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
    const [trips, setTrips] = useState([]);
    const [stopsDict, setStopsDict] = useState({});
    const [loading, setLoading] = useState(false);
    const [availableLines, setAvailableLines] = useState([]);
    const echartRef = useRef(null);
    // Track whether zoom was triggered internally to avoid circular updates
    const zoomFromSlider = useRef(false);

    // Data fetching — identical to previous implementation
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

                const uniqueLines = Array.from(new Set(fetchedTrips.map(t => String(t.li_no)))).sort();
                setAvailableLines(uniqueLines);

                // Calculate korridor_fahrzeit for each trip
                fetchedTrips.forEach(t => {
                    const sortedPoints = [...t.points].sort((a, b) => a.li_lfd_nr - b.li_lfd_nr);
                    if (sortedPoints.length > 0) {
                        const firstPt = sortedPoints[0];
                        const lastPt = sortedPoints[sortedPoints.length - 1];
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

                // Build stop dictionary
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

    // Apply line filter
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
            setHiddenLines?.(prev => {
                const next = new Set(prev);
                availableLines.forEach(l => next.delete(String(l)));
                return next;
            });
        } else {
            setHiddenLines?.(prev => {
                const next = new Set(prev);
                availableLines.forEach(l => next.add(String(l)));
                return next;
            });
        }
    };

    // Compute time range
    const timeRange = useMemo(() => {
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
        if (minTime === Infinity || maxTime === -Infinity) return null;
        return { min: Math.floor(minTime / 60) * 60, max: Math.ceil(maxTime / 60) * 60 };
    }, [trips]);

    // Compute stop indices for Y-axis
    const maxY = useMemo(() => {
        const indices = Object.keys(stopsDict).map(k => stopsDict[k].index);
        return indices.length > 0 ? Math.max(...indices) : 0;
    }, [stopsDict]);

    // Initialize global time when data loads
    useEffect(() => {
        if (timeRange && !globalTimeFrom && !globalTimeTo) {
            setGlobalTimeFrom?.(formatSeconds(timeRange.min));
            setGlobalTimeTo?.(formatSeconds(timeRange.max));
        }
    }, [timeRange, globalTimeFrom, globalTimeTo, setGlobalTimeFrom, setGlobalTimeTo]);

    // Compute zoom percent from global time
    const zoomPercent = useMemo(() => {
        if (!timeRange) return { start: 0, end: 100 };
        const totalRange = timeRange.max - timeRange.min;
        if (totalRange <= 0) return { start: 0, end: 100 };

        let start = 0;
        let end = 100;

        if (globalTimeFrom) {
            const sec = parseTimeToSeconds(globalTimeFrom);
            if (sec != null) {
                start = Math.max(0, ((sec - timeRange.min) / totalRange) * 100);
            }
        }
        if (globalTimeTo) {
            const sec = parseTimeToSeconds(globalTimeTo);
            if (sec != null) {
                end = Math.min(100, ((sec - timeRange.min) / totalRange) * 100);
            }
        }
        return { start, end };
    }, [timeRange, globalTimeFrom, globalTimeTo]);

    // Build ECharts series from filtered trips
    const series = useMemo(() => {
        return filteredTrips.map(trip => {
            const lineData = trip.points
                .filter(p => {
                    const key = p.stop_abbr || p.stop_id;
                    return stopsDict[key] !== undefined;
                })
                .map(p => {
                    const key = p.stop_abbr || p.stop_id;
                    return {
                        value: [p.abfahrt, stopsDict[key].index],
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

            const color = getColorForLine(trip.li_no);
            return {
                type: 'line',
                data: lineData,
                symbol: 'circle',
                symbolSize: 10,
                showSymbol: true, // Must be true so ECharts renders them for hit-testing
                triggerLineEvent: true, // Allow the line itself to trigger the tooltip
                itemStyle: {
                    color: color,
                    opacity: 0 // Invisible but clickable/hoverable
                },
                lineStyle: {
                    width: trip.is_depot_run ? 1.5 : 2,
                    type: trip.is_depot_run ? 'dashed' : 'solid',
                    opacity: trip.is_depot_run ? 0.6 : 0.85,
                    color: color
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1,
                        borderColor: '#ffffff',
                        borderWidth: 2
                    },
                    lineStyle: {
                        width: 3.5,
                        opacity: 1
                    }
                },
                silent: false,
                animation: false,
                z: trip.is_depot_run ? 1 : 2
            };
        });
    }, [filteredTrips, stopsDict]);

    // Y-axis label lookup
    const yAxisLabels = useMemo(() => {
        const labels = {};
        Object.keys(stopsDict).forEach(k => {
            labels[stopsDict[k].index] = stopsDict[k].text;
        });
        return labels;
    }, [stopsDict]);

    // Handle dataZoom changes from ECharts slider
    const onDataZoom = useCallback((params) => {
        if (!timeRange) return;
        const totalRange = timeRange.max - timeRange.min;

        // ECharts may provide dataZoom in batch or single event
        let startPct, endPct;
        if (params.batch) {
            startPct = params.batch[0].start;
            endPct = params.batch[0].end;
        } else {
            startPct = params.start;
            endPct = params.end;
        }

        if (startPct == null || endPct == null) return;

        const fromSec = timeRange.min + (startPct / 100) * totalRange;
        const toSec = timeRange.min + (endPct / 100) * totalRange;

        zoomFromSlider.current = true;
        setGlobalTimeFrom?.(formatSeconds(fromSec));
        setGlobalTimeTo?.(formatSeconds(toSec));
        // Reset after a tick to allow the effect to skip
        requestAnimationFrame(() => { zoomFromSlider.current = false; });
    }, [timeRange, setGlobalTimeFrom, setGlobalTimeTo]);

    // Build ECharts option
    const option = useMemo(() => {
        if (trips.length === 0) return {};

        const stopTicks = Object.keys(stopsDict)
            .map(k => stopsDict[k].index)
            .sort((a, b) => a - b);

        return {
            animation: false,
            grid: {
                top: 10,
                right: 30,
                bottom: 80,
                left: 110
            },
            xAxis: {
                type: 'value',
                min: timeRange ? timeRange.min - 300 : undefined,
                max: timeRange ? timeRange.max + 300 : undefined,
                axisLabel: {
                    formatter: (v) => formatSeconds(v),
                    color: '#9CA3AF',
                    fontSize: 12
                },
                axisLine: { lineStyle: { color: '#374151' } },
                splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }
            },
            yAxis: {
                type: 'value',
                min: -0.2,
                max: maxY + 0.2,
                inverse: true,
                axisLabel: {
                    formatter: (v) => {
                        const rounded = Math.round(v);
                        if (rounded !== v) return '';
                        return yAxisLabels[rounded] ? yAxisLabels[rounded].substring(0, 18) : '';
                    },
                    color: '#9CA3AF',
                    fontSize: 11
                },
                axisLine: { lineStyle: { color: '#374151' } },
                splitLine: { lineStyle: { color: '#1F2937', type: 'dashed' } },
                interval: 1
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: '#111318',
                borderColor: '#374151',
                borderWidth: 1,
                textStyle: { color: '#ffffff', fontSize: 12 },
                confine: true,
                formatter: (params) => {
                    const d = params.data;
                    if (!d) return '';
                    const color = getColorForLine(d.li_no);
                    const rows = [
                        `<div style="font-weight:700;font-size:13px;margin-bottom:6px">${d.stop_text || ''}</div>`,
                        `<div style="display:grid;grid-template-columns:auto auto;gap:2px 12px;font-size:11px">`,
                        `<span style="color:#9CA3AF">Zeit:</span><span style="font-family:monospace;font-weight:700">${formatSeconds(d.value[0])} Uhr</span>`,
                        `<span style="color:#9CA3AF">Linie:</span><span style="font-weight:700;background:${color};padding:1px 8px;border-radius:4px;display:inline-block">${d.li_no}</span>`,
                        `<span style="color:#9CA3AF">Fahrt-ID:</span><span style="font-family:monospace">${d.schedule_id}</span>`,
                    ];
                    if (d.richtung != null) {
                        const rText = d.richtung === 1 ? 'Hin' : d.richtung === 2 ? 'Rück' : d.richtung;
                        rows.push(`<span style="color:#9CA3AF">Richtung:</span><span>${rText}</span>`);
                    }
                    if (d.korridor_fahrzeit != null) {
                        rows.push(`<span style="color:#9CA3AF;border-top:1px solid #374151;padding-top:4px;margin-top:4px">Korridor-Fahrzeit:</span><span style="color:#3F83F8;font-weight:700;border-top:1px solid #374151;padding-top:4px;margin-top:4px">${formatFahrzeit(d.korridor_fahrzeit)}</span>`);
                    }
                    if (d.fahrt_start) {
                        rows.push(`<span style="color:#9CA3AF">Von:</span><span style="color:#3F83F8;font-size:10px">${d.fahrt_start}</span>`);
                    }
                    if (d.fahrt_end) {
                        rows.push(`<span style="color:#9CA3AF">Nach:</span><span style="color:#3F83F8;font-size:10px">${d.fahrt_end}</span>`);
                    }
                    if (d.is_depot_run) {
                        rows.push(`<span style="color:#9CA3AF">Typ:</span><span style="color:#FBBF24;font-style:italic">Ein-/Aussetzer</span>`);
                    }
                    rows.push('</div>');
                    return rows.join('');
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    start: zoomPercent.start,
                    end: zoomPercent.end,
                    height: 25,
                    bottom: 10,
                    borderColor: '#374151',
                    backgroundColor: '#111318',
                    fillerColor: 'rgba(63,131,248,0.15)',
                    handleStyle: { color: '#3F83F8' },
                    textStyle: { color: '#9CA3AF', fontSize: 11 },
                    labelFormatter: (v) => formatSeconds(v),
                    brushSelect: false
                }
            ],
            series: series
        };
    }, [trips, filteredTrips, stopsDict, series, maxY, yAxisLabels, timeRange, zoomPercent]);

    // Handle time input changes
    const handleTimeFromChange = useCallback((value) => {
        const sec = parseTimeToSeconds(value);
        if (sec == null || !timeRange) return;
        setGlobalTimeFrom?.(value);
    }, [timeRange, setGlobalTimeFrom]);

    const handleTimeToChange = useCallback((value) => {
        const sec = parseTimeToSeconds(value);
        if (sec == null || !timeRange) return;
        setGlobalTimeTo?.(value);
    }, [timeRange, setGlobalTimeTo]);

    // Sync ECharts zoom when global time changes externally (from input fields)
    useEffect(() => {
        if (zoomFromSlider.current) return;
        const inst = echartRef.current?.getEchartsInstance?.();
        if (!inst || !timeRange) return;

        inst.dispatchAction({
            type: 'dataZoom',
            start: zoomPercent.start,
            end: zoomPercent.end
        });
    }, [zoomPercent, timeRange]);

    // Early returns AFTER all hooks
    if (!startStopId || !endStopId) {
        return (
            <div id="bildfahrplan-chart" className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                <p>Bitte Start- und Ziel-Haltestelle wählen.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div id="bildfahrplan-chart" className="w-full h-full flex items-center justify-center text-text-muted">
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Lade Bildfahrplan…
                </div>
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div id="bildfahrplan-chart" className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                <p>Keine Fahrten für diese Korridor-Auswahl gefunden.</p>
            </div>
        );
    }

    return (
        <div id="bildfahrplan-chart" className="w-full h-full flex flex-col">
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3 mb-2 px-1">
                {/* Time inputs */}
                <div className="flex items-center gap-3 bg-[#111318] rounded-lg px-3 py-1.5 border border-border-dark">
                    <div className="flex items-center gap-2">
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

                {/* Line Filter Pills */}
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
                                    className="px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"
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

                <span className="text-[10px] text-slate-500 ml-auto hidden md:block">Hovern für Details • Zeitbereich kann per Schieber unten eingestellt werden</span>
            </div>

            {/* ECharts Canvas */}
            <div className="flex-1 relative" style={{ minHeight: 300 }}>
                <ReactEChartsCore
                    ref={echartRef}
                    echarts={echarts}
                    option={option}
                    style={{ width: '100%', height: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                    onEvents={{ dataZoom: onDataZoom }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    );
}
