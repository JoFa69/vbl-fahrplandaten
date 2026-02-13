import React, { useEffect, useState } from 'react';
import { fetchInfrastructureMetrics } from '../api';
import './VolumeMetrics.css';

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
        <div className="metrics-panel">
            <div className="metrics-header">
                <h3>Infrastruktur (Haltestellen-Belastung)</h3>
                {view === "detail" && (
                    <button onClick={() => { setSelectedStop(null); setView("top"); }}>
                        &larr; Zurück zu Top Haltestellen
                    </button>
                )}
            </div>

            {loading ? <div>Lade Daten...</div> : (
                <div className="bar-chart-container">
                    <h4>{view === "top" ? "Top 15 Haltestellen (Abfahrten)" : `Belastung pro Stunde: ${selectedStop.label}`}</h4>
                    <div className="bar-chart-layout">
                        {data.map((item, idx) => (
                            <div
                                key={idx}
                                className="bar-item"
                                onClick={() => handleSelect(item)}
                                title={`${item.label}: ${item.value}`}
                            >
                                <div
                                    className="bar-fill"
                                    style={{
                                        height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                                        backgroundColor: '#f59e0b' // Amber/Orange
                                    }}
                                ></div>
                                <span className="bar-label">{item.label}</span>
                                <span className="bar-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
