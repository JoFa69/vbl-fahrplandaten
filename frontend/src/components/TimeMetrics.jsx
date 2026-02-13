import React, { useEffect, useState } from 'react';
import { fetchTimeMetrics } from '../api';
import './VolumeMetrics.css'; // Reuse existing styles for consistency

const MetricsList = ({ data, onSelect, title, unit = "min" }) => {
    if (!data || data.length === 0) return <div>Keine Daten</div>;
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="bar-chart-container">
            <h4>{title}</h4>
            <div className="bar-chart-layout">
                {data.map((item, idx) => (
                    <div
                        key={idx}
                        className="bar-item"
                        onClick={() => onSelect && onSelect(item)}
                        title={`${item.label} (${item.name || ''}): ${item.value} ${unit}`}
                    >
                        <div
                            className="bar-fill"
                            style={{
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: '#10b981' // Green for time
                            }}
                        ></div>
                        <span className="bar-label">{item.label}</span>
                        <span className="bar-value">{item.value}</span>
                    </div>
                ))}
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
        <div className="metrics-panel">
            <div className="metrics-header">
                <h3>Zeit-Metriken</h3>
                {level !== "line" && (
                    <button onClick={handleBack}>&larr; Zurück</button>
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
