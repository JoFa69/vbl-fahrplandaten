import React, { useState, useEffect, useMemo } from 'react';
import { fetchUmlaeufeGantt, fetchUmlaeufeActiveVehicles, fetchUmlaeufeChartsStats } from '../api';
import GanttChartComponent from '../components/charts/GanttChartComponent';
import UmlaufScatterPlot from '../components/charts/UmlaufScatterPlot';
import UmlaufAreaChart from '../components/charts/UmlaufAreaChart';
import UmlaufHistogram from '../components/charts/UmlaufHistogram';
import UmlaufDonut from '../components/charts/UmlaufDonut';
import Spinner from '../components/ui/Spinner';

const TAGESART_TABS = ['Alle', 'Mo-Fr', 'Sa', 'So/Ft'];

const UmlaufChartsPage = () => {
    const [ganttData, setGanttData] = useState([]);
    const [activeVehicles, setActiveVehicles] = useState([]);
    const [statsData, setStatsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagesart, setTagesart] = useState('Alle');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [gantt, active, stats] = await Promise.all([
                    fetchUmlaeufeGantt(tagesart),
                    fetchUmlaeufeActiveVehicles(tagesart),
                    fetchUmlaeufeChartsStats(tagesart),
                ]);
                setGanttData(gantt);
                setActiveVehicles(active);
                setStatsData(stats);
            } catch (err) {
                console.error('API error', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [tagesart]);

    const histogramData = useMemo(() => {
        if (!statsData.length) return [];
        const bins = {};
        statsData.forEach(d => {
            if (d.dauer_stunden <= 0) return;
            const hourBin = Math.floor(d.dauer_stunden);
            const label = `${hourBin}-${hourBin + 1}h`;
            if (!bins[label]) bins[label] = { label, anzahl: 0, sortKey: hourBin };
            bins[label].anzahl += 1;
        });
        return Object.values(bins).sort((a, b) => a.sortKey - b.sortKey);
    }, [statsData]);

    const efficiencyData = useMemo(() => {
        if (!ganttData.length || !statsData.length) return [];
        let productiveSec = 0;
        ganttData.forEach(u => { u.fahrten.forEach(f => { productiveSec += (f.ende_zeit_sekunden - f.start_zeit_sekunden); }); });
        const productiveH = productiveSec / 3600;
        const totalH = statsData.reduce((sum, d) => sum + d.dauer_stunden, 0);
        return [
            { name: 'Produktive Fahrzeit', value: Number(productiveH.toFixed(1)) },
            { name: 'Standzeit / Wendezeit', value: Number(Math.max(0, totalH - productiveH).toFixed(1)) },
        ];
    }, [ganttData, statsData]);

    const peakVehicles = useMemo(() => {
        if (!activeVehicles.length) return { count: 0, time: '-' };
        const peak = activeVehicles.reduce((max, obj) => obj.active_count > max.active_count ? obj : max, activeVehicles[0]);
        return { count: peak.active_count, time: peak.time_label };
    }, [activeVehicles]);

    if (loading) return <Spinner label="Lade Dashboard..." />;
    if (error) return <div className="p-4 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">Fehler: {error}</div>;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-border-dark p-4 rounded-xl gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Umlauf-Analyse & Effizienz</h1>
                    <p className="text-text-muted text-sm">Interaktives Dashboard zur Optimierung der Fahrzeugumläufe.</p>
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

            {/* Active Vehicles Card */}
            <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-white font-bold text-base">Fahrzeug-Auslastung im Tagesverlauf</h3>
                        <p className="text-text-muted text-sm mt-0.5">Anzahl gleichzeitig aktiver Fahrzeuge von 04:00 bis 02:00 Uhr (Folgetag)</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Spitzenlast</p>
                        <span className="text-emerald-400 text-3xl font-black">{peakVehicles.count} Fzg.</span>
                        <p className="text-text-muted text-xs">um {peakVehicles.time} Uhr</p>
                    </div>
                </div>
                <div className="h-72">
                    <UmlaufAreaChart data={activeVehicles} />
                </div>
            </div>

            {/* Histogram, Donut, Scatter */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                    <h3 className="text-white font-bold text-base">Verteilung Umlaufdauern</h3>
                    <p className="text-text-muted text-sm mt-0.5 mb-4">Anzahl der Umläufe gebündelt nach Gesamtstunden</p>
                    <div className="h-60">
                        <UmlaufHistogram data={histogramData} />
                    </div>
                </div>

                <div className="bg-slate-900 border border-border-dark rounded-xl p-6 flex flex-col">
                    <div>
                        <h3 className="text-white font-bold text-base">Effizienz: Fahrbetrieb vs. Standzeit</h3>
                        <p className="text-text-muted text-sm mt-0.5 mb-4">Kumulierte Stunden aller Umläufe</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        <UmlaufDonut data={efficiencyData} />
                    </div>
                    {efficiencyData.length >= 2 && (
                        <div className="flex justify-center flex-wrap gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-slate-300">Fahrt ({efficiencyData[0].value} h)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                                <span className="text-slate-300">Stand/Wende ({efficiencyData[1].value} h)</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                    <h3 className="text-white font-bold text-base">Fahrten vs. Distanz</h3>
                    <p className="text-text-muted text-sm mt-0.5 mb-4">Outlier-Check: Tagesdistanz vs. Einzelfahrten</p>
                    <div className="h-[260px] w-full">
                        <UmlaufScatterPlot data={statsData} />
                    </div>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="bg-slate-900 border border-border-dark rounded-xl p-6">
                <h3 className="text-white font-bold text-base">Gantt-Diagramm (Fahrplan-Ablauf)</h3>
                <p className="text-text-muted text-sm mt-0.5 mb-4">
                    Zeitbalken jedes Umlaufs. Fahrten werden farblich nach Linien getrennt. Graue Lücken markieren Wende- oder Pausenzeiten.
                </p>
                <GanttChartComponent data={ganttData} />
            </div>
        </div>
    );
};

export default UmlaufChartsPage;
