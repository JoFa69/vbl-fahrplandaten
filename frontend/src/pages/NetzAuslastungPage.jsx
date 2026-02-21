import React, { useState, useEffect } from 'react';
import { fetchPrimaryRoutes } from '../api';
import GeometryMap from '../components/GeometryMap';

export default function NetzAuslastungPage() {
    const [primaryRoutes, setPrimaryRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('load'); // 'load' or 'details'
    const [timeValue, setTimeValue] = useState(8);

    useEffect(() => {
        async function load() {
            try {
                const routes = await fetchPrimaryRoutes();
                setPrimaryRoutes(routes || []);
            } catch (e) {
                console.error('Failed to load routes', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const formatTime = (h) => `${String(h).padStart(2, '0')}:00`;

    return (
        <div className="relative flex-1 h-full overflow-hidden bg-bg-dark">
            {/* Full-Screen Map */}
            <div className="absolute inset-0">
                {primaryRoutes.length > 0 ? (
                    <GeometryMap routeData={null} selectedLine={null} primaryRoutes={primaryRoutes} />
                ) : (
                    <div className="w-full h-full map-bg flex items-center justify-center">
                        <div className="text-center text-text-muted">
                            <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">layers</span>
                            <h3 className="text-lg font-semibold text-slate-300 mb-1">Netz-Auslastung</h3>
                            <p className="text-sm">Lade Netzwerk-Daten...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Controls — Top Left: Filters */}
            <div className="absolute top-4 left-4 z-10 glass-panel rounded-xl p-4 w-72 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">filter_alt</span>
                    Filter
                </h3>
                <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">
                        Linienbündel
                    </label>
                    <select className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:ring-1 focus:ring-primary focus:border-primary">
                        <option>Alle Linien</option>
                        <option>Bus</option>
                        <option>Tram</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">
                        Tagestyp
                    </label>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded">
                            Mo-Fr
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-700 hover:bg-slate-700">
                            Sa
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-700 hover:bg-slate-700">
                            So
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">
                        Richtung
                    </label>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded">
                            Beide
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-700 hover:bg-slate-700">
                            Hin
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded border border-slate-700 hover:bg-slate-700">
                            Rück
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Controls — Top Center: Mode Toggle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass-panel rounded-xl p-1 flex gap-1">
                <button
                    onClick={() => setViewMode('details')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${viewMode === 'details'
                            ? 'bg-primary text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm mr-1.5 align-bottom">info</span>
                    Linien-Details
                </button>
                <button
                    onClick={() => setViewMode('load')}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${viewMode === 'load'
                            ? 'bg-primary text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm mr-1.5 align-bottom">layers</span>
                    Netz-Auslastung
                </button>
            </div>

            {/* Bottom: Timeline Player */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-panel rounded-xl p-4 w-[600px] max-w-[90%]">
                <div className="flex items-center gap-4">
                    <button className="text-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-2xl">play_arrow</span>
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Zeitschiene</span>
                            <span className="text-xs font-bold text-primary">{formatTime(timeValue)}</span>
                        </div>
                        <input
                            type="range"
                            min={4}
                            max={24}
                            value={timeValue}
                            onChange={(e) => setTimeValue(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none"
                            style={{
                                background: `linear-gradient(to right, #135bec 0%, #135bec ${((timeValue - 4) / 20) * 100}%, #334155 ${((timeValue - 4) / 20) * 100}%, #334155 100%)`,
                            }}
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                            <span>04:00</span>
                            <span>08:00</span>
                            <span>12:00</span>
                            <span>16:00</span>
                            <span>20:00</span>
                            <span>24:00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Right: Legend */}
            <div className="absolute bottom-6 right-4 z-10 glass-panel rounded-xl p-4 w-52 space-y-3">
                <h4 className="text-xs font-bold text-white">Legende</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 rounded bg-emerald-500" />
                        <span className="text-[10px] text-slate-300">&gt; 30 km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 rounded bg-amber-500" />
                        <span className="text-[10px] text-slate-300">15–30 km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1 rounded bg-red-500" />
                        <span className="text-[10px] text-slate-300">&lt; 15 km/h</span>
                    </div>
                </div>
                <div className="border-t border-slate-700 pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 rounded bg-slate-400" />
                        <span className="text-[10px] text-slate-300">Gering</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-1.5 rounded bg-slate-400" />
                        <span className="text-[10px] text-slate-300">Mittel</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-2.5 rounded bg-slate-400" />
                        <span className="text-[10px] text-slate-300">Hoch</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
