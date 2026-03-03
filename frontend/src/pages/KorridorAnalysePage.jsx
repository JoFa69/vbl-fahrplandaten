import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllStops, fetchTimetableTagesarten } from '../api';
import BildfahrplanChart from '../components/corridor/BildfahrplanChart';
import MatrixChart from '../components/corridor/MatrixChart';
import FrequencyChart from '../components/corridor/FrequencyChart';
import HeadwayChart from '../components/corridor/HeadwayChart';
import SearchableSelect from '../components/SearchableSelect';

export default function KorridorAnalysePage() {
    const [stops, setStops] = useState([]);
    const [tagesarten, setTagesarten] = useState(["Mo-Fr", "Sa", "So/Ft"]);

    // Global filters
    const [selectedStopId, setSelectedStopId] = useState("");
    const [selectedTagesart, setSelectedTagesart] = useState("Mo-Fr");
    const [selectedRichtung, setSelectedRichtung] = useState("");
    const [showDepotRuns, setShowDepotRuns] = useState(true);

    // Start/End for Bildfahrplan
    const [startStopId, setStartStopId] = useState("");
    const [endStopId, setEndStopId] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSelectors() {
            try {
                const [stopsData, tagesartenData] = await Promise.all([
                    fetchAllStops(),
                    fetchTimetableTagesarten()
                ]);

                // Sort stops alphabetically
                const sortedStops = (stopsData || []).sort((a, b) =>
                    (a.stop_name || "").localeCompare(b.stop_name || "")
                );

                setStops(sortedStops);
                if (tagesartenData && tagesartenData.length > 0) {
                    setTagesarten(tagesartenData);
                    const validAbbrs = tagesartenData.map(t => typeof t === 'string' ? t : t.abbr);
                    if (!validAbbrs.includes(selectedTagesart)) {
                        setSelectedTagesart(validAbbrs[0]);
                    }
                }

                // Preset default stops to save user time
                if (sortedStops.length > 0) {
                    const pilatus = sortedStops.find(s => (s.stop_name || "").includes("Pilatusplatz"));
                    const bhf = sortedStops.find(s => (s.stop_name || "").includes("Bahnhof"));

                    if (pilatus && !selectedStopId) {
                        setSelectedStopId(pilatus.stop_id);
                        setStartStopId(pilatus.stop_id);
                    }
                    if (bhf && !endStopId) {
                        setEndStopId(bhf.stop_id);
                    }
                }
            } catch (e) {
                console.error("Failed to load selectors", e);
            } finally {
                setLoading(false);
            }
        }
        loadSelectors();
    }, []);

    const stopOptions = useMemo(() => {
        return stops.map(s => ({ value: s.stop_id, label: s.stop_name }));
    }, [stops]);

    if (loading) {
        return (
            <div className="flex-1 p-8 text-white flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4">refresh</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar bg-[#0B0D11]">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">timeline</span>
                        Korridor- & Haltestellen-Analyse
                    </h1>
                    <p className="text-text-muted mt-2 text-sm max-w-2xl">
                        Detaillierte Analyse von Taktstabilität, Fahrzeugfolgen und Fahrtenfrequenzen auf Streckenabschnitten und Knotenpunkten.
                    </p>
                </div>

                {/* Global Filters */}
                <div className="flex gap-4">
                    <select
                        className="bg-surface-dark border border-border-dark text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                        value={selectedTagesart}
                        onChange={(e) => setSelectedTagesart(e.target.value)}
                    >
                        {tagesarten.map(ta => {
                            const val = typeof ta === 'string' ? ta : ta.abbr;
                            const label = typeof ta === 'string' ? ta : ta.text;
                            return <option key={val} value={val}>{label}</option>;
                        })}
                    </select>

                    <select
                        className="bg-surface-dark border border-border-dark text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                        value={selectedRichtung}
                        onChange={(e) => setSelectedRichtung(e.target.value)}
                    >
                        <option value="">Alle Richtungen</option>
                        <option value="1">Richtung 1 (Hin)</option>
                        <option value="2">Richtung 2 (Rück)</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm text-white bg-surface-dark border border-border-dark px-3 py-2 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-primary bg-[#111318] border-primary/30 focus:ring-primary"
                            checked={showDepotRuns}
                            onChange={(e) => setShowDepotRuns(e.target.checked)}
                        />
                        <span className="whitespace-nowrap">Ein-/Aussetzer</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* 1. Bildfahrplan */}
                <div className="col-span-1 xl:col-span-2 bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">swap_calls</span>
                                Korridor-Bildfahrplan (Weg-Zeit)
                            </h2>
                            <p className="text-xs text-text-muted mt-1">Stellt die Überlagerung und Überholvorgänge zwischen zwei Haltestellen dar.</p>
                        </div>
                        <div className="flex gap-3">
                            <SearchableSelect
                                className="w-[250px]"
                                placeholder="Start-Haltestelle..."
                                value={startStopId}
                                options={stopOptions}
                                onChange={(e) => setStartStopId(e.target.value)}
                            />
                            <span className="text-slate-500 self-center">➔</span>
                            <SearchableSelect
                                className="w-[250px]"
                                placeholder="Ziel-Haltestelle..."
                                value={endStopId}
                                options={stopOptions}
                                onChange={(e) => setEndStopId(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <BildfahrplanChart
                            startStopId={startStopId}
                            endStopId={endStopId}
                            tagesart={selectedTagesart}
                            showDepotRuns={showDepotRuns}
                        />
                    </div>
                </div>

                {/* Main Stop Selector for below charts */}
                <div className="col-span-1 xl:col-span-2 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Knotenpunkt-Selektion</h3>
                        <p className="text-xs text-primary/70">Wählen Sie einen Knotenpunkt für die unteren drei Analysen aus.</p>
                    </div>
                    <SearchableSelect
                        className="w-[350px]"
                        placeholder="Knotenpunkt wählen..."
                        value={selectedStopId}
                        options={stopOptions}
                        onChange={(e) => setSelectedStopId(e.target.value)}
                    />
                </div>

                {/* 2. Frequency Bar Chart */}
                <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary">stacked_bar_chart</span>
                        Summiertes Angebot
                    </h2>
                    <p className="text-xs text-text-muted mb-6">Aufschlüsselung der Gesamtfahrtenzahl nach Linien am Knotenpunkt.</p>
                    <div className="flex-1 min-h-[300px]">
                        <FrequencyChart
                            stopId={selectedStopId}
                            tagesart={selectedTagesart}
                            richtung={selectedRichtung}
                            showDepotRuns={showDepotRuns}
                        />
                    </div>
                </div>

                {/* 3. Headway Chart */}
                <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary">ssid_chart</span>
                        Takt-Verlauf & Stabilität
                    </h2>
                    <p className="text-xs text-text-muted mb-6">Verlauf der tatsächlichen Wartezeit (Zeitabstand zum Vorfahrer).</p>
                    <div className="flex-1 min-h-[300px]">
                        <HeadwayChart
                            stopId={selectedStopId}
                            tagesart={selectedTagesart}
                            richtung={selectedRichtung}
                            showDepotRuns={showDepotRuns}
                        />
                    </div>
                </div>

                {/* 4. Matrix Chart */}
                <div className="col-span-1 xl:col-span-2 bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                    <div className="flex justify-between items-start mb-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">apps</span>
                            Abfahrtsminuten-Matrix
                        </h2>
                    </div>
                    <p className="text-xs text-text-muted mb-6">Visualisierung des Gesamt-Taktrasters zur Identifikation von Lücken oder Doppelbelegungen.</p>
                    <div className="h-[750px] w-full">
                        <MatrixChart
                            stopId={selectedStopId}
                            tagesart={selectedTagesart}
                            richtung={selectedRichtung}
                            showDepotRuns={showDepotRuns}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
