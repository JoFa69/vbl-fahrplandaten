import React, { useState, useEffect } from 'react';
import { fetchAllStops } from '../api';
import MapComponent from '../components/charts/MapComponent';
import ScatterPlotComponent from '../components/charts/ScatterPlotComponent';
import TreeMapComponent from '../components/charts/TreeMapComponent';

const TAGESART_TABS = ['Alle', 'Mo-Fr', 'Sa', 'So/Ft'];

export default function HaltestellenChartsPage() {
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagesart, setTagesart] = useState('Alle');

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await fetchAllStops(tagesart);
                setStops(data || []);
            } catch (e) {
                console.error('Failed to load stops for charts', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tagesart]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-dark bg-surface-dark flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white">Haltestellen-Visualisierung</h2>
                    <p className="text-xs text-text-muted mt-0.5">{stops.length} Haltestellen · 60/40 Layout</p>
                </div>

                {/* Tagesart Filter Tabs */}
                <div className="flex p-1 bg-[#101622] rounded-lg border border-border-dark">
                    {TAGESART_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTagesart(tab)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${tagesart === tab
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-text-muted hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                        <p className="text-sm text-text-muted">Lade Daten für {tagesart}…</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md text-center">
                        <span className="material-symbols-outlined text-3xl text-red-500 mb-2">error</span>
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden p-4 flex flex-col lg:flex-row gap-4 h-full">
                    {/* Map (Left, 60%) */}
                    <div className="lg:w-[60%] flex flex-col h-full">
                        <ChartCard title="Geografische Verteilung" icon="public" subtitle="Bubble Map – Größe ∝ Frequenz, Farbe ∝ Linien">
                            <MapComponent data={stops} />
                        </ChartCard>
                    </div>

                    {/* Right column (40%, split vertically) */}
                    <div className="lg:w-[40%] flex flex-col gap-4 h-full">
                        {/* Scatter Plot (Top, 50%) */}
                        <div className="flex-1 min-h-[300px] flex flex-col">
                            <ChartCard title="Linien vs. Frequenz" icon="scatter_plot" subtitle="Streudiagramm – Korrelation zwischen Linienanzahl und Frequenz">
                                <ScatterPlotComponent data={stops} />
                            </ChartCard>
                        </div>

                        {/* TreeMap (Bottom, 50%) */}
                        <div className="flex-1 min-h-[300px] flex flex-col">
                            <ChartCard title="Netz-Gewichtung" icon="grid_view" subtitle="TreeMap – Fläche ∝ Frequenz, Farbe ∝ Linien">
                                <TreeMapComponent data={stops} />
                            </ChartCard>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ChartCard({ title, icon, subtitle, children }) {
    return (
        <div className="bg-surface-dark border border-border-dark rounded-xl flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-border-dark flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                    {subtitle && <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{subtitle}</p>}
                </div>
            </div>
            <div className="flex-1 relative">
                {children}
            </div>
        </div>
    );
}
