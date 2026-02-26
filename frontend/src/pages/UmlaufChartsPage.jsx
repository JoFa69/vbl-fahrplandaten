import React, { useState, useEffect, useMemo } from 'react';
import { Card, Title, Grid, Text, Flex, Metric } from "@tremor/react";
import GanttChartComponent from '../components/charts/GanttChartComponent';
import UmlaufScatterPlot from '../components/charts/UmlaufScatterPlot';
import UmlaufAreaChart from '../components/charts/UmlaufAreaChart';
import UmlaufHistogram from '../components/charts/UmlaufHistogram';
import UmlaufDonut from '../components/charts/UmlaufDonut';

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
                const [resGantt, resActive, resStats] = await Promise.all([
                    fetch(`http://localhost:8000/api/umlaeufe/gantt?limit=200&day_type=${tagesart}`),
                    fetch(`http://localhost:8000/api/umlaeufe/active_vehicles?day_type=${tagesart}`),
                    fetch(`http://localhost:8000/api/umlaeufe/charts_stats?day_type=${tagesart}`)
                ]);

                if (!resGantt.ok || !resActive.ok || !resStats.ok) {
                    throw new Error("Fehler beim Laden der API-Daten.");
                }

                setGanttData(await resGantt.json());
                setActiveVehicles(await resActive.json());
                setStatsData(await resStats.json());
            } catch (err) {
                console.error("API error", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [tagesart]);

    // 1. Histogram Data (Dauer)
    const histogramData = useMemo(() => {
        if (!statsData.length) return [];
        // Bin by hour
        const bins = {};
        statsData.forEach(d => {
            // Ignore corrupted zero duration
            if (d.dauer_stunden <= 0) return;
            // Round to nearest int or floor
            const hourBin = Math.floor(d.dauer_stunden);
            const label = `${hourBin}-${hourBin + 1}h`;
            if (!bins[label]) bins[label] = { label, anzahl: 0, sortKey: hourBin };
            bins[label].anzahl += 1;
        });
        return Object.values(bins).sort((a, b) => a.sortKey - b.sortKey);
    }, [statsData]);

    // 2. Efficiency Donut Data (Productive vs Unproductive)
    const efficiencyData = useMemo(() => {
        if (!ganttData.length || !statsData.length) return [];

        // Productive time = sum of all trips duration in hours
        let productiveSec = 0;
        ganttData.forEach(u => {
            u.fahrten.forEach(f => {
                productiveSec += (f.ende_zeit_sekunden - f.start_zeit_sekunden);
            });
        });
        const productiveH = productiveSec / 3600;

        // Total time = sum of all umlauf duration
        const totalH = statsData.reduce((sum, d) => sum + d.dauer_stunden, 0);
        const unproductiveH = Math.max(0, totalH - productiveH);

        return [
            { name: "Produktive Fahrzeit", value: Number(productiveH.toFixed(1)) },
            { name: "Standzeit / Wendezeit", value: Number(unproductiveH.toFixed(1)) }
        ];
    }, [ganttData, statsData]);

    // Summary Metric for Active Vehicles peak
    const peakVehicles = useMemo(() => {
        if (!activeVehicles.length) return { count: 0, time: '-' };
        const peak = activeVehicles.reduce((max, obj) => obj.active_count > max.active_count ? obj : max, activeVehicles[0]);
        return { count: peak.active_count, time: peak.time_label };
    }, [activeVehicles]);

    if (loading) return <div className="p-4 text-gray-400">Lade Dashboard...</div>;
    if (error) return <div className="p-4 text-red-500 bg-red-500/10 rounded-lg">Fehler: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Umlauf-Analyse & Effizienz
                    </h1>
                    <p className="text-gray-400">
                        Interaktives Dashboard zur Optimierung der Fahrzeugumläufe.
                    </p>
                </div>

                {/* Tagesart Filter Tabs */}
                <div className="flex p-1 bg-[#101622] rounded-lg border border-gray-800">
                    {TAGESART_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTagesart(tab)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tagesart === tab
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Row 1: Active Vehicles */}
            <Card className="bg-gray-900 border-gray-800">
                <Flex alignItems="start">
                    <div>
                        <Title className="text-white">Fahrzeug-Auslastung im Tagesverlauf</Title>
                        <Text className="text-gray-400">Anzahl gleichzeitig aktiver Fahrzeuge von 04:00 bis 02:00 Uhr (Folgetag)</Text>
                    </div>
                    <div className="text-right">
                        <Text className="text-gray-400">Spitzenlast (Peak Service)</Text>
                        <Metric className="text-emerald-500">{peakVehicles.count} Fzg.</Metric>
                        <Text className="text-gray-500 text-sm">um {peakVehicles.time} Uhr</Text>
                    </div>
                </Flex>
                <div className="mt-4 h-72">
                    <UmlaufAreaChart data={activeVehicles} />
                </div>
            </Card>

            {/* Row 2: Histogram & Donut & Scatter */}
            <Grid numItemsSm={1} numItemsLg={3} className="gap-6">

                {/* Histogram */}
                <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-1">
                    <Title className="text-white">Verteilung Umlaufdauern</Title>
                    <Text className="text-gray-400 mb-4">Anzahl der Umläufe gebündelt nach Gesamtstunden</Text>
                    <div className="h-60 mt-4">
                        <UmlaufHistogram data={histogramData} />
                    </div>
                </Card>

                {/* Efficiency Donut */}
                <Card className="bg-gray-900 border-gray-800 flex flex-col justify-between items-center col-span-1 lg:col-span-1">
                    <div className="w-full">
                        <Title className="text-white">Effizienz: Fahrbetrieb vs. Standzeit</Title>
                        <Text className="text-gray-400 mb-4">Kumulierte Stunden aller Umläufe</Text>
                    </div>
                    <div className="flex-1 flex items-center justify-center w-full min-h-[200px]">
                        <UmlaufDonut data={efficiencyData} />
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 w-full mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="text-gray-300">Fahrt ({efficiencyData[0].value} h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                            <span className="text-gray-300">Stand/Wende ({efficiencyData[1].value} h)</span>
                        </div>
                    </div>
                </Card>

                {/* Scatter Plot */}
                <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-1">
                    <Title className="text-white">Fahrten vs. Distanz</Title>
                    <Text className="text-gray-400 mb-4">Outlier-Check: Tagesdistanz vs. Einzelfahrten</Text>
                    <div className="h-[260px] w-full">
                        <UmlaufScatterPlot data={statsData} />
                    </div>
                </Card>
            </Grid>

            {/* Row 3: Gantt Chart */}
            <Card className="bg-gray-900 border-gray-800">
                <Title className="text-white">Gantt-Diagramm (Fahrplan-Ablauf)</Title>
                <Text className="text-gray-400 mb-4">Zeitbalken jedes Umlaufs. Fahrten werden farblich nach Linien getrennt. Graue Lücken markieren Wende- oder Pausenzeiten.</Text>
                <GanttChartComponent data={ganttData} />
            </Card>

        </div>
    );
};

export default UmlaufChartsPage;
