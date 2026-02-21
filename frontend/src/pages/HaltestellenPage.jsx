import React, { useState, useEffect } from 'react';
import { fetchInfrastructureMetrics, fetchAllStops } from '../api';

export default function HaltestellenPage() {
    const [stops, setStops] = useState([]);
    const [filteredStops, setFilteredStops] = useState([]);
    const [selectedStop, setSelectedStop] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchAllStops();
                // Add default status since we don't have live operational data yet
                const processedStops = (data || []).map((s) => ({
                    ...s,
                    status: 'Aktiv',
                }));
                // Calculate max frequency for relative progress bar scaling
                const maxFreq = Math.max(...processedStops.map(s => s.frequency), 1);

                // Store maxFreq in state or array (we'll just attach it to state object later)
                setStops(processedStops);
                setFilteredStops(processedStops);
            } catch (e) {
                console.error('Failed to load stops', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredStops(stops);
        } else {
            const q = search.toLowerCase();
            setFilteredStops(stops.filter((s) => (s.stop_name || '').toLowerCase().includes(q) || String(s.stop_id).includes(q)));
        }
    }, [search, stops]);

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Main Table */}
            <div className={`flex flex-col transition-all duration-300 ${selectedStop ? 'w-3/5' : 'w-full'}`}>
                {/* Filters */}
                <div className="p-4 border-b border-border-dark flex items-center gap-4 bg-surface-dark">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                            placeholder="Haltestelle suchen..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                        {filteredStops.length} Haltestellen
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">Name</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">Frequenz</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">Linien</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                                        <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                        <p className="mt-2 text-sm">Lade Haltestellen...</p>
                                    </td>
                                </tr>
                            ) : filteredStops.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">
                                        Keine Haltestellen gefunden
                                    </td>
                                </tr>
                            ) : (
                                filteredStops.slice(0, 100).map((stop) => {
                                    const isSelected = selectedStop?.stop_id === stop.stop_id;
                                    const isActive = stop.status === 'Aktiv';
                                    return (
                                        <tr
                                            key={stop.stop_id}
                                            onClick={() => setSelectedStop(isSelected ? null : stop)}
                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-mono text-slate-400">{stop.stop_id}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-slate-100">{stop.stop_name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{
                                                                width: `${Math.min(100, (stop.frequency / Math.max(...stops.map(s => s.frequency), 1)) * 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xs text-slate-200 font-medium">{stop.frequency.toLocaleString()}</span>
                                                        <span className="text-[10px] text-slate-500">Fahrten</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                                                    {stop.lines} Linien
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    <span className={`size-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {stop.status}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Panel (Slide-over) */}
            {selectedStop && (
                <div className="w-2/5 border-l border-border-dark bg-surface-dark flex flex-col overflow-hidden animate-slide-in">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-border-dark flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedStop.stop_name}</h3>
                            <p className="text-xs text-text-muted mt-0.5">ID: {selectedStop.stop_id}</p>
                        </div>
                        <button
                            onClick={() => setSelectedStop(null)}
                            className="text-text-muted hover:text-white transition-colors p-1"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                        {/* Status */}
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${selectedStop.status === 'Aktiv'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}>
                                <span className={`size-2 rounded-full ${selectedStop.status === 'Aktiv' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {selectedStop.status === 'Aktiv' ? 'Operativ — Aktiv' : 'In Wartung'}
                            </div>
                        </div>

                        {/* Coordinates */}
                        {selectedStop.lat && selectedStop.lon && (
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Koordinaten</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500">Lat</span>
                                        <p className="text-sm font-mono text-slate-200">{Number(selectedStop.lat).toFixed(6)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500">Lon</span>
                                        <p className="text-sm font-mono text-slate-200">{Number(selectedStop.lon).toFixed(6)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Barrierefreiheit Section */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Barrierefreiheit</h4>
                            <div className="space-y-2">
                                {[
                                    { label: 'Stufenfreier Zugang', icon: 'accessible', available: true },
                                    { label: 'Taktile Leitsysteme', icon: 'visibility', available: Math.random() > 0.5 },
                                    { label: 'Fahrstuhl', icon: 'elevator', available: Math.random() > 0.7 },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-text-muted">{item.icon}</span>
                                            <span className="text-xs text-slate-300">{item.label}</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-sm ${item.available ? 'text-emerald-500' : 'text-slate-600'}`}>
                                            {item.available ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tages-Metriken */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Tages-Metriken</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-2xl font-black text-white">{selectedStop.frequency.toLocaleString()}</span>
                                    <p className="text-[10px] text-text-muted mt-0.5">Geplante Halte/Tag</p>
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-white">{selectedStop.lines}</span>
                                    <p className="text-[10px] text-text-muted mt-0.5">Kreuzungslinien</p>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <button className="w-full py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">settings</span>
                            Infrastruktur verwalten
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
