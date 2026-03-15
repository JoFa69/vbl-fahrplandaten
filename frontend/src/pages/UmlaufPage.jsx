import React, { useState, useEffect } from 'react';
import { formatTime, formatNumber } from '../utils/formatters';
import { fetchUmlaeufeSummary, fetchUmlaeufeList } from '../api';
import KpiCard from '../components/ui/KpiCard';
import Spinner from '../components/ui/Spinner';

const TAGESART_TABS = ['Alle', 'Mo-Fr', 'Sa', 'So/Ft'];

const UmlaufPage = () => {
    const [summary, setSummary] = useState(null);
    const [umlaeufe, setUmlaeufe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagesart, setTagesart] = useState('Alle');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const summaryData = await fetchUmlaeufeSummary(tagesart);
                setSummary(summaryData);

                const listData = await fetchUmlaeufeList(tagesart);
                setUmlaeufe(listData.data || []);
            } catch (err) {
                console.error('Error fetching Umlauf data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tagesart]);

    if (loading) return <Spinner label="Lade Umlauf-Daten..." />;
    if (error) return (
        <div className="p-6 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
            Fehler beim Laden: {error}
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-border-dark p-4 rounded-xl gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Umlauf-Übersicht</h1>
                    <p className="text-text-muted text-sm">
                        Analyse der Fahrzeugumläufe basierend auf geplanten Fahrten und Strecken.
                    </p>
                </div>
                <div className="flex p-1 bg-slate-800 rounded-lg border border-border-dark gap-1">
                    {TAGESART_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTagesart(tab)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tagesart === tab
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-muted hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Aktive Umläufe"
                        value={formatNumber(summary.total_umlaeufe)}
                        icon="label"
                        iconColor="text-blue-400"
                    />
                    <KpiCard
                        label="Ø Dauer pro Umlauf"
                        value={`${formatNumber(summary.avg_dauer_minuten / 60, 1)} h`}
                        icon="schedule"
                        iconColor="text-emerald-400"
                    />
                    <KpiCard
                        label="Total zugewiesene Fahrten"
                        value={formatNumber(summary.total_fahrten)}
                        icon="bar_chart"
                        iconColor="text-amber-400"
                    />
                    <KpiCard
                        label="Gesamtdistanz (Plan)"
                        value={`${formatNumber(summary.total_distanz_km)} km`}
                        icon="map"
                        iconColor="text-purple-400"
                    />
                </div>
            )}

            {/* Umläufe Table */}
            <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-dark">
                    <h3 className="text-base font-bold text-white">Alle Umläufe ({umlaeufe.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-800/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark">Umlauf ID</th>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark text-right">Anzahl Fahrten</th>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark">Erste Abfahrt</th>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark">Letzte Ankunft</th>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark text-right">Dauer (Std.)</th>
                                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-dark text-right">Distanz (km)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {umlaeufe.map((item) => (
                                <tr key={item.umlauf_id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-3 text-white font-medium">#{item.umlauf_id}</td>
                                    <td className="px-5 py-3 text-right text-slate-300 font-mono">
                                        {item.anzahl_fahrten > 50 && (
                                            <span className="material-symbols-outlined text-emerald-400 text-sm align-middle mr-1">trending_up</span>
                                        )}
                                        {formatNumber(item.anzahl_fahrten)}
                                    </td>
                                    <td className="px-5 py-3 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            {formatTime(item.start_zeit_sekunden)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                            {formatTime(item.ende_zeit_sekunden)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right text-slate-300 font-mono">
                                        {formatNumber(item.dauer_stunden, 1)} h
                                    </td>
                                    <td className="px-5 py-3 text-right font-mono">
                                        <span className="text-blue-400">{formatNumber(item.distanz_km, 1)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UmlaufPage;
