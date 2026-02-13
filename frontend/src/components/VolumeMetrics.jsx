import React, { useEffect, useState } from 'react';
import { fetchVolumeMetrics } from '../api';
import './VolumeMetrics.css';

// Simple Bar Chart Component (using HTML/CSS for zero dependencies)
// Simple Bar Chart Component (using HTML/CSS for zero dependencies)
const BarChart = ({ data, onBarClick, title, yLabel, viewMode }) => {
    if (!data || data.length === 0) return <div>Keine Daten verfügbar</div>;

    // Limit to top 50 for readability if there are many items
    const truncatedData = data.length > 50 ? data.slice(0, 50) : data;
    const maxValue = Math.max(...data.map(d => d.value));

    const getLabel = (item) => {
        // if (viewMode === 'line') return `Linie ${item.label}`; // User requested no "Linie" prefix
        if (viewMode === 'hour') return `${item.label} h`;
        return item.label;
    };

    return (
        <div className="bar-chart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ color: '#111827', fontWeight: 600 }}>{title}</h4>
                {data.length > 50 && <small style={{ color: '#4b5563' }}>Zeige Top 50 von {data.length} Einträgen</small>}
            </div>
            {yLabel && <div className="y-axis-label">{yLabel}</div>}
            <div className="bar-chart-layout">
                {truncatedData.map((item, idx) => (
                    <div
                        key={idx}
                        className="bar-item"
                        onClick={() => onBarClick && onBarClick(item)}
                        title={`${item.label}: ${item.value} Fahrten`}
                    >
                        <span className="bar-value" style={{ marginBottom: '5px' }}>{item.value}</span>
                        <div
                            className="bar-fill"
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        ></div>
                        <span className="bar-label">{getLabel(item)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function VolumeMetrics() {
    // State
    const [viewMode, setViewMode] = useState("line"); // 'line', 'hour', 'direction'
    const [selectedLine, setSelectedLine] = useState(null);
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
            setSelectedLine({ id: item.id, label: item.label });
            setViewMode("hour");
        }
    };

    const resetFilter = () => {
        setSelectedLine(null);
        setViewMode("line");
    };

    return (
        <div className="metrics-panel">
            <div className="metrics-header">
                <h3>Fahrten-Volumen</h3>
                <div className="controls">
                    {selectedLine && (
                        <button onClick={resetFilter}>
                            &larr; Alle Linien ({selectedLine.label})
                        </button>
                    )}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        disabled={!!selectedLine && viewMode === "hour"} // Simplified logic
                    >
                        <option value="line">Nach Linie</option>
                        <option value="hour">Nach Stunde</option>
                        <option value="direction">Nach Richtung</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div>Lade Daten...</div>
            ) : (
                <BarChart
                    data={data}
                    onBarClick={handleBarClick}
                    title={selectedLine ? `Volumen für Linie ${selectedLine.label} nach ${viewMode}` : `Volumen nach ${viewMode}`}
                    viewMode={viewMode}
                />
            )}
        </div>
    );
}
