import React, { useEffect, useState } from 'react';
import { fetchGeometryMetrics } from '../api';
import './VolumeMetrics.css';

export default function GeometryMetrics() {
    const [level, setLevel] = useState("lines"); // lines -> variants -> stops
    const [selectedLine, setSelectedLine] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                let res = [];
                if (level === "lines") {
                    res = await fetchGeometryMetrics("lines");
                } else if (level === "variants") {
                    res = await fetchGeometryMetrics("variants", selectedLine.id);
                } else if (level === "stops") {
                    res = await fetchGeometryMetrics("stops", null, selectedVariant.id);
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

    const handleLineClick = (line) => {
        setSelectedLine(line);
        setLevel("variants");
    };

    const handleVariantClick = (variant) => {
        setSelectedVariant(variant);
        setLevel("stops");
    };

    return (
        <div className="metrics-panel">
            <div className="metrics-header">
                <h3>Netz-Geometrie</h3>
                {level !== "lines" && (
                    <button onClick={() => {
                        if (level === "stops") setLevel("variants");
                        else setLevel("lines");
                    }}>
                        &larr; Zurück
                    </button>
                )}
            </div>

            {loading ? <div>Lade Daten...</div> : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {level === "lines" && (
                        <table className="chart-table">
                            <thead><tr><th>Linie</th><th>Varianten</th><th>Aktion</th></tr></thead>
                            <tbody>
                                {data.map(l => (
                                    <tr key={l.id}>
                                        <td>{l.name}</td>
                                        <td>{l.variants}</td>
                                        <td><button onClick={() => handleLineClick(l)}>Details</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {level === "variants" && (
                        <table className="chart-table">
                            <thead><tr><th>Variante (Hash)</th><th>Haltestellen</th><th>Aktion</th></tr></thead>
                            <tbody>
                                {data.map(v => (
                                    <tr key={v.id}>
                                        <td title={v.hash}>{v.hash.substring(0, 20)}...</td>
                                        <td>{v.stop_count}</td>
                                        <td><button onClick={() => handleVariantClick(v)}>Stops anzeigen</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {level === "stops" && (
                        <table className="chart-table">
                            <thead><tr><th>Seq</th><th>Haltestelle</th><th>Lat/Lon</th></tr></thead>
                            <tbody>
                                {data.map(s => (
                                    <tr key={s.seq}>
                                        <td>{s.seq}</td>
                                        <td>{s.name}</td>
                                        <td>{s.lat.toFixed(4)}, {s.lon.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
