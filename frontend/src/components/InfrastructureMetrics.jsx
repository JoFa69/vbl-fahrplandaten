import React, { useEffect, useState } from 'react';
import { fetchInfrastructureMetrics } from '../api';

export default function InfrastructureMetrics() {
    const [view, setView] = useState("top"); // top -> detail
    const [selectedStop, setSelectedStop] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                if (view === "top") {
                    const res = await fetchInfrastructureMetrics(null, 15);
                    setData(res);
                } else if (view === "detail" && selectedStop) {
                    const res = await fetchInfrastructureMetrics(selectedStop.id);
                    setData(res);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [view, selectedStop]);

    const handleSelect = (item) => {
        if (view === "top") {
            setSelectedStop(item);
            setView("detail");
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-semibold text-white">Infrastruktur (Haltestellen)</h3>
                {view === "detail" && (
                    <button
                        onClick={() => { setSelectedStop(null); setView("top"); }}
                        className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                    >
                        &larr; Zurück
                    </button>
                )}
            </div>

            {loading ? <div className="text-slate-400">Lade Daten...</div> : (
                <div className="w-full h-full flex flex-col">
                    <h4 className="text-slate-200 font-semibold mb-4 shrink-0">
                        {view === "top" ? "Top 15 Haltestellen (Abfahrten)" : `Belastung pro Stunde: ${selectedStop.label}`}
                    </h4>
                    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                        <div className="flex items-end h-full gap-2 px-1 min-w-full w-max">
                            {data.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center justify-end h-full cursor-pointer hover:opacity-80 transition-opacity min-w-[40px] shrink-0 group"
                                    onClick={() => handleSelect(item)}
                                    title={`${item.label}: ${item.value}`}
                                >
                                    <div
                                        className="w-full bg-amber-500 rounded-t-sm min-h-[4px] relative group-hover:bg-amber-400 transition-colors"
                                        style={{
                                            height: `${Math.max((item.value / Math.max(...data.map(d => d.value))) * 100, 1)}%`,
                                        }}
                                    ></div>
                                    <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-300 mt-1">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
