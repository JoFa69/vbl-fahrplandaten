import React, { useState, useEffect } from 'react';
import NetworkMap from '../components/NetworkMap';
import { fetchNetworkNodes, fetchTimetableTagesarten } from '../api';
import Spinner from '../components/ui/Spinner';

const TIME_WINDOWS = [
    { label: 'Ganzer Tag (00:00 - 24:00)', from: 0, to: 86400 },
    { label: 'Morgen-HVZ (06:00 - 09:00)', from: 21600, to: 32400 },
    { label: 'Nebenverkehrszeit (09:00 - 16:00)', from: 32400, to: 57600 },
    { label: 'Abend-HVZ (16:00 - 19:00)', from: 57600, to: 68400 },
    { label: 'Abendverkehr (19:00 - 00:00)', from: 68400, to: 86400 },
];

const SELECT_CLASS = 'bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer';

export default function NetworkMapPage() {
    const [tagesarten, setTagesarten] = useState([]);
    const [selectedTagesart, setSelectedTagesart] = useState('Mo-Fr');
    const [selectedTimeWindow, setSelectedTimeWindow] = useState('Morgen-HVZ (06:00 - 09:00)');
    const [selectedDirection, setSelectedDirection] = useState('Beide');
    const [networkData, setNetworkData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function loadTagesarten() {
            try {
                const data = await fetchTimetableTagesarten();
                if (isMounted) {
                    setTagesarten(data);
                    if (data.length > 0 && !data.find(d => d.abbr === selectedTagesart)) {
                        setSelectedTagesart(data[0].abbr);
                    }
                }
            } catch (err) {
                console.error('Failed to load tagesarten', err);
            }
        }
        loadTagesarten();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setIsLoading(true);
            setError(null);
            try {
                const windowDef = TIME_WINDOWS.find(w => w.label === selectedTimeWindow) || TIME_WINDOWS[0];
                const directionVal = selectedDirection === 'Hin' ? 1 : (selectedDirection === 'Rück' ? 2 : null);
                const data = await fetchNetworkNodes(selectedTagesart, windowDef.from, windowDef.to, directionVal);
                if (isMounted) setNetworkData(data);
            } catch (err) {
                if (isMounted) { setError('Fehler beim Laden der Netzdaten: ' + err.message); setNetworkData(null); }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        if (selectedTagesart) loadData();
        return () => { isMounted = false; };
    }, [selectedTagesart, selectedTimeWindow, selectedDirection]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400">map</span>
                        Netzplan Visualisierung
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Abstrakte Darstellung des Netzes basierend auf den Fahrplandaten.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-900 border border-border-dark p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">calendar_today</span>
                        <select value={selectedTagesart} onChange={(e) => setSelectedTagesart(e.target.value)} className={SELECT_CLASS}>
                            {tagesarten.map(t => <option key={t.abbr} value={t.abbr}>{t.text}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">schedule</span>
                        <select value={selectedTimeWindow} onChange={(e) => setSelectedTimeWindow(e.target.value)} className={SELECT_CLASS}>
                            {TIME_WINDOWS.map(w => <option key={w.label} value={w.label}>{w.label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">swap_horiz</span>
                        <select value={selectedDirection} onChange={(e) => setSelectedDirection(e.target.value)} className={SELECT_CLASS}>
                            <option value="Beide">Beide</option>
                            <option value="Hin">Hinrichtung</option>
                            <option value="Rück">Rückrichtung</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Map Card */}
            <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden h-[calc(100vh-200px)] min-h-[600px] flex flex-col relative">
                <div className="flex-1 w-full h-full relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                            <Spinner label="Netzplan wird berechnet..." />
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-6 text-center">
                            <div>
                                <span className="material-symbols-outlined text-red-400 text-5xl mb-2 block">error</span>
                                <h3 className="text-red-400 font-bold text-base mb-1">Ein Fehler ist aufgetreten</h3>
                                <p className="text-text-muted text-sm">{error}</p>
                            </div>
                        </div>
                    )}
                    <NetworkMap data={networkData} />
                </div>

                {/* Stats Overlay */}
                {networkData && !isLoading && !error && (
                    <div className="absolute bottom-6 left-6 z-[1000] bg-slate-800/90 backdrop-blur-sm shadow-lg border border-border-dark rounded-xl p-4 flex gap-6">
                        <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider font-semibold mb-1">Knoten</p>
                            <span className="text-indigo-400 text-2xl font-black">{networkData.nodes.length}</span>
                        </div>
                        <div className="w-px bg-border-dark self-stretch" />
                        <div>
                            <p className="text-text-muted text-xs uppercase tracking-wider font-semibold mb-1">Kanten</p>
                            <span className="text-emerald-400 text-2xl font-black">{networkData.edges.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
