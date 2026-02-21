import React, { useEffect, useState } from 'react';
import { fetchVolumeMetrics } from '../api';
// Simple Bar Chart Component (using Tailwind)
const BarChart = ({ data, onBarClick, title, yLabel, viewMode }) => {
    if (!data || data.length === 0) return <div className="text-slate-400">Keine Daten verfügbar</div>;

    // Limit to top 50 for readability if there are many items
    const truncatedData = data.length > 50 ? data.slice(0, 50) : data;
    const maxValue = Math.max(...data.map(d => d.value));

    const getLabel = (item) => {
        if (viewMode === 'hour') return `${item.label} h`;
        return item.label;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h4 className="text-slate-200 font-semibold">{title}</h4>
                {data.length > 50 && <small className="text-slate-500">Zeige Top 50 von {data.length} Einträgen</small>}
            </div>
            {yLabel && <div className="text-slate-400 text-xs mb-1">{yLabel}</div>}

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                <div className="flex items-end h-full gap-2 px-1 min-w-full w-max">
                    {truncatedData.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center justify-end h-full cursor-pointer hover:opacity-80 transition-opacity min-w-[40px] shrink-0 group"
                            onClick={() => onBarClick && onBarClick(item)}
                            title={`${item.label}: ${item.value} Fahrten`}
                        >
                            <span className="text-xs font-bold text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.value}
                            </span>
                            <div
                                className="w-full bg-blue-500 rounded-t-sm min-h-[4px] relative group-hover:bg-blue-400 transition-colors"
                                style={{ height: `${Math.max((item.value / maxValue) * 100, 1)}%` }}
                            ></div>
                            <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                                {getLabel(item)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function VolumeMetrics({ selectedLine, onLineSelect }) {
    // State
    const [viewMode, setViewMode] = useState("line"); // 'line', 'hour', 'direction'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Data
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // Fetch based on current view mode and selected line
                // Drill-down logic:
                // If viewMode is 'line', we see all lines.
                // If we select a line, we can drill down to 'hour' or 'direction' for that line.
                // For now, let's keep it simple: top level tabs switch group_by.
                // If a line is selected (filtered), we pass line_no.

                const lineNoParam = selectedLine ? selectedLine.id : null; // id stores line_no string now
                const result = await fetchVolumeMetrics(lineNoParam, viewMode);
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [viewMode, selectedLine]);

    // Handlers
    const handleBarClick = (item) => {
        if (viewMode === "line" && item.id) {
            // Drill down into this line -> show hourly profile
            if (onLineSelect) {
                onLineSelect({ id: item.id, label: item.label });
            }
            setViewMode("hour");
        }
    };

    const resetFilter = () => {
        if (onLineSelect) {
            onLineSelect(null);
        }
        setViewMode("line");
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Fahrten-Volumen</h3>
                <div className="flex gap-2">
                    {selectedLine && (
                        <button
                            onClick={resetFilter}
                            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                        >
                            &larr; Alle Linien ({selectedLine.label})
                        </button>
                    )}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        disabled={!!selectedLine && viewMode === "hour"}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                    >
                        <option value="line">Nach Linie</option>
                        <option value="hour">Nach Stunde</option>
                        <option value="direction">Nach Richtung</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-400">Lade Daten...</div>
                ) : (
                    <BarChart
                        data={data}
                        onBarClick={handleBarClick}
                        title={selectedLine ? `Volumen für Linie ${selectedLine.label} nach ${viewMode}` : `Volumen nach ${viewMode}`}
                        viewMode={viewMode}
                    />
                )}
            </div>
        </div>
    );
}
