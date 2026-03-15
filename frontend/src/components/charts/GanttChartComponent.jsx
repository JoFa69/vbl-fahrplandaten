import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { formatTime } from '../../utils/formatters';

const GanttChartComponent = ({ data = [] }) => {
    // data is an array of GanttUmlauf: { umlauf_id: 123, fahrten: [{start_zeit_sekunden, ende_zeit_sekunden, li_no}] }

    // Constant time range: 04:00 (14400) to 26:00 (93600)
    const MIN_TIME = 14400;
    const MAX_TIME = 93600;
    const TOTAL_TIME = MAX_TIME - MIN_TIME;

    // Generate color palette for lines
    const colorScale = useMemo(() => {
        const lines = new Set();
        data.forEach(u => u.fahrten.forEach(f => lines.add(f.li_no)));
        return d3.scaleOrdinal(d3.schemePaired).domain(Array.from(lines));
    }, [data]);

    // Generate time ticks every 2 hours
    const timeTicks = [];
    for (let t = MIN_TIME; t <= MAX_TIME; t += 7200) {
        timeTicks.push(t);
    }

    if (!data.length) return <div className="text-gray-500 py-10 text-center">Keine Gantt-Daten verfügbar</div>;

    return (
        <div className="w-full overflow-x-auto bg-gray-900/50 rounded-lg border border-gray-800 p-4">
            <div className="min-w-[800px]">
                {/* Header / Axis */}
                <div className="flex border-b border-gray-700 pb-2 mb-2 relative h-8">
                    <div className="w-24 flex-shrink-0 text-gray-400 font-semibold text-sm">Umlauf</div>
                    <div className="flex-grow relative h-full">
                        {timeTicks.map(tick => {
                            const percent = ((tick - MIN_TIME) / TOTAL_TIME) * 100;
                            return (
                                <div
                                    key={tick}
                                    className="absolute top-0 text-xs text-gray-500 translate-x-[-50%]"
                                    style={{ left: `${percent}%` }}
                                >
                                    {formatTime(tick)}
                                    <div className="h-2 border-l border-gray-600 mt-1 mx-auto w-px"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                    {data.map((umlauf) => (
                        <div key={umlauf.umlauf_id} className="flex items-center group">
                            <div className="w-24 flex-shrink-0 text-gray-300 font-mono text-sm group-hover:text-blue-400 transition-colors">
                                #{umlauf.umlauf_id}
                            </div>
                            <div className="flex-grow relative h-6 bg-gray-800/40 rounded-sm border-y border-gray-800/50">
                                {/* Grid lines background */}
                                {timeTicks.map(tick => (
                                    <div
                                        key={tick}
                                        className="absolute top-0 bottom-0 border-l border-gray-700/30"
                                        style={{ left: `${((tick - MIN_TIME) / TOTAL_TIME) * 100}%` }}
                                    ></div>
                                ))}

                                {/* Trips */}
                                {umlauf.fahrten.map((fahrt, i) => {
                                    // Clamp start and end to our window
                                    const start = Math.max(MIN_TIME, fahrt.start_zeit_sekunden);
                                    const end = Math.min(MAX_TIME, fahrt.ende_zeit_sekunden);
                                    if (start >= MAX_TIME || end <= MIN_TIME) return null;

                                    const leftPct = ((start - MIN_TIME) / TOTAL_TIME) * 100;
                                    const widthPct = ((end - start) / TOTAL_TIME) * 100;
                                    const color = colorScale(fahrt.li_no);

                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-1 bottom-1 rounded-sm opacity-90 hover:opacity-100 hover:z-10 transition-opacity cursor-pointer shadow-sm flex items-center justify-center overflow-hidden"
                                            style={{
                                                left: `${leftPct}%`,
                                                width: `${widthPct}%`,
                                                backgroundColor: color
                                            }}
                                            title={`Linie: ${fahrt.li_no}\nStart: ${formatTime(fahrt.start_zeit_sekunden)}\nEnde: ${formatTime(fahrt.ende_zeit_sekunden)}\nDauer: ${Math.round((fahrt.ende_zeit_sekunden - fahrt.start_zeit_sekunden) / 60)} min`}
                                        >
                                            {widthPct > 2 && (
                                                <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md truncate px-1">
                                                    {fahrt.li_no}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-3 items-center text-sm border-t border-gray-800 pt-4">
                <span className="text-gray-400 font-medium mr-2">Linien-Legende:</span>
                {Array.from(new Set(data.flatMap(u => u.fahrten.map(f => f.li_no)))).sort().map(line => (
                    <div key={line} className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScale(line) }}></div>
                        <span className="text-gray-300 font-mono">{line}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GanttChartComponent;
