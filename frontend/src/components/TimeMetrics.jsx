import React, { useEffect, useState } from 'react';
import { fetchTimeMetrics } from '../api';
const MetricsList = ({ data, onSelect, title, unit = "min" }) => {
    if (!data || data.length === 0) return <div className="text-slate-400">Keine Daten</div>;
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full h-full flex flex-col">
            <h4 className="text-slate-200 font-semibold mb-4 shrink-0">{title}</h4>
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
                <div className="flex items-end h-full gap-2 px-1 min-w-full w-max">
                    {data.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center justify-end h-full cursor-pointer hover:opacity-80 transition-opacity min-w-[40px] shrink-0 group"
                            onClick={() => onSelect && onSelect(item)}
                            title={`${item.label} (${item.name || ''}): ${item.value} ${unit}`}
                        >
                            <div
                                className="w-full bg-emerald-500 rounded-t-sm min-h-[4px] relative group-hover:bg-emerald-400 transition-colors"
                                style={{
                                    height: `${Math.max((item.value / maxValue) * 100, 1)}%`,
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
    );
};

export default function TimeMetrics() {
    const [level, setLevel] = useState("line"); // line -> variant -> hour
    const [selectedLine, setSelectedLine] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                let res;
                if (level === "line") {
                    res = await fetchTimeMetrics();
                } else if (level === "variant" && selectedLine) {
                    res = await fetchTimeMetrics(selectedLine.id);
                } else if (level === "hour" && selectedVariant) {
                    res = await fetchTimeMetrics(null, selectedVariant.id);
                }
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [level, selectedLine, selectedVariant]);

    const handleSelect = (item) => {
        if (level === "line") {
            setSelectedLine(item);
            setLevel("variant");
        } else if (level === "variant") {
            setSelectedVariant(item);
            setLevel("hour");
        }
    };

    const handleBack = () => {
        if (level === "hour") {
            setSelectedVariant(null);
            setLevel("variant");
        } else if (level === "variant") {
            setSelectedLine(null);
            setLevel("line");
        }
    };

    const getTitle = () => {
        if (level === "line") return "Durchschnittliche Fahrtdauer pro Linie (min)";
        if (level === "variant") return `Dauer pro Route (Linie ${selectedLine.label})`;
        if (level === "hour") return `Dauer pro Stunde (Route ${selectedVariant.label})`;
        return "Zeit-Analyse";
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-semibold text-white">Zeit-Metriken</h3>
                {level !== "line" && (
                    <button
                        onClick={handleBack}
                        className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                    >
                        &larr; Zurück
                    </button>
                )}
            </div>

            {loading ? <div>Lade Daten...</div> : (
                <MetricsList
                    data={data}
                    onSelect={handleSelect}
                    title={getTitle()}
                />
            )}
        </div>
    );
}
