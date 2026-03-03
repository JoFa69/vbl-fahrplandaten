import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllStops, fetchTimetableTagesarten } from '../api';
import { useLocalStorage, useLocalStorageSet } from '../hooks/useLocalStorage';
import BildfahrplanChart from '../components/corridor/BildfahrplanChart';
import MatrixChart from '../components/corridor/MatrixChart';
import FrequencyChart from '../components/corridor/FrequencyChart';
import HeadwayChart from '../components/corridor/HeadwayChart';
import BoxplotChart from '../components/corridor/BoxplotChart';
import DeviationChart from '../components/corridor/DeviationChart';
import HeatmapTimeline from '../components/corridor/HeatmapTimeline';
import SearchableSelect from '../components/SearchableSelect';

export default function KorridorAnalysePage() {
    const [stops, setStops] = useState([]);
    const [tagesarten, setTagesarten] = useState(["Mo-Fr", "Sa", "So/Ft"]);

    // Tab State
    const [activeTab, setActiveTab] = useLocalStorage('korridorActiveTab', 'A');

    // Global filters
    const [selectedStopId, setSelectedStopId] = useLocalStorage("korridorSelectedStopId", "");
    const [selectedTagesart, setSelectedTagesart] = useLocalStorage("korridorSelectedTagesart", "Mo-Fr");
    const [selectedRichtung, setSelectedRichtung] = useLocalStorage("korridorSelectedRichtung", "");
    const [showDepotRuns, setShowDepotRuns] = useLocalStorage("korridorShowDepotRuns", true);

    // Global line filter
    const [hiddenLines, setHiddenLines] = useLocalStorageSet("korridorHiddenLines", new Set());

    // Start/End for Bildfahrplan
    const [startStopId, setStartStopId] = useLocalStorage("korridorStartStopId", "");
    const [endStopId, setEndStopId] = useLocalStorage("korridorEndStopId", "");
    const [timeFrom, setTimeFrom] = useLocalStorage("korridorTimeFrom", "");
    const [timeTo, setTimeTo] = useLocalStorage("korridorTimeTo", "");

    // Takt-Qualität controls (shared across Section C)
    const [targetHeadway, setTargetHeadway] = useLocalStorage("korridorTargetHeadway", 10);
    const [tolerance, setTolerance] = useLocalStorage("korridorTolerance", 2);

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

            {/* Tab Navigation */}
            <div className="flex border-b border-border-dark mb-8">
                <button
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'A' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-dark'}`}
                    onClick={() => setActiveTab('A')}
                >
                    <span className="material-symbols-outlined align-middle mr-2 text-lg">route</span>
                    Strecken-Analyse
                </button>
                <button
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'B' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-dark'}`}
                    onClick={() => setActiveTab('B')}
                >
                    <span className="material-symbols-outlined align-middle mr-2 text-lg">hub</span>
                    Knoten-Angebot
                </button>
                <button
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'C' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-dark'}`}
                    onClick={() => setActiveTab('C')}
                >
                    <span className="material-symbols-outlined align-middle mr-2 text-lg">network_check</span>
                    Takt-Qualität
                </button>
            </div>

            {/* ═══════════════════════════════════════════
                SEKTION A — Korridor-Strecke
            ═══════════════════════════════════════════ */}
            {activeTab === 'A' && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">route</span>
                        <h2 className="text-lg font-bold text-white">Sektion A — Korridor-Strecke</h2>
                        <div className="flex-1 h-px bg-border-dark ml-2"></div>
                    </div>

                    <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">swap_calls</span>
                                    Korridor-Bildfahrplan (Weg-Zeit)
                                </h3>
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
                                hiddenLines={hiddenLines}
                                setHiddenLines={setHiddenLines}
                                globalTimeFrom={timeFrom}
                                setGlobalTimeFrom={setTimeFrom}
                                globalTimeTo={timeTo}
                                setGlobalTimeTo={setTimeTo}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SEKTION B — Knotenpunkt: Angebot & Frequenz
            ═══════════════════════════════════════════ */}
            {activeTab === 'B' && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">hub</span>
                        <h2 className="text-lg font-bold text-white">Sektion B — Angebot & Frequenz</h2>
                        <div className="flex-1 h-px bg-border-dark ml-2"></div>
                    </div>

                    {/* Knotenpunkt Selector */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-white">Knotenpunkt-Selektion</h3>
                            <p className="text-xs text-primary/70">Wählen Sie einen Knotenpunkt für alle folgenden Analysen aus.</p>
                        </div>
                        <SearchableSelect
                            className="w-[350px]"
                            placeholder="Knotenpunkt wählen..."
                            value={selectedStopId}
                            options={stopOptions}
                            onChange={(e) => setSelectedStopId(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Summiertes Angebot */}
                        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary">stacked_bar_chart</span>
                                Summiertes Angebot
                            </h3>
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

                        {/* Abfahrtsminuten-Matrix */}
                        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary">apps</span>
                                Abfahrtsminuten-Matrix
                            </h3>
                            <p className="text-xs text-text-muted mb-6">Taktraster zur Identifikation von Lücken oder Doppelbelegungen.</p>
                            <div className="flex-1 min-h-[600px]">
                                <MatrixChart
                                    stopId={selectedStopId}
                                    tagesart={selectedTagesart}
                                    richtung={selectedRichtung}
                                    showDepotRuns={showDepotRuns}
                                    hiddenLines={hiddenLines}
                                    setHiddenLines={setHiddenLines}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                SEKTION C — Knotenpunkt: Takt-Qualität & Stabilität
            ═══════════════════════════════════════════ */}
            {activeTab === 'C' && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">speed</span>
                        <h2 className="text-lg font-bold text-white">Sektion C — Takt-Qualität & Stabilität</h2>
                        <div className="flex-1 h-px bg-border-dark ml-2"></div>
                    </div>

                    {/* Soll-Takt & Toleranz Controls */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-base">tune</span>
                                Soll-Takt & Toleranz
                            </h3>
                            <p className="text-xs text-amber-400/70">Referenzwerte für alle Takt-Qualitätsdiagramme in dieser Sektion.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-400">Soll-Takt (Min):</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={targetHeadway}
                                    onChange={(e) => setTargetHeadway(Number(e.target.value))}
                                    className="bg-surface border border-border-dark rounded px-2 py-1 text-xs text-white w-16 outline-none focus:border-primary"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-400">Toleranz (± Min):</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={tolerance}
                                    onChange={(e) => setTolerance(Number(e.target.value))}
                                    className="bg-surface border border-border-dark rounded px-2 py-1 text-xs text-white w-16 outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* C0: Heatmap Timeline (compact, full width) */}
                    <div className="bg-surface-dark rounded-2xl border border-border-dark p-4 shadow-lg shadow-black/20 mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-base">thermostat</span>
                            Takt-Stabilität Übersicht
                            <span className="text-[10px] text-primary/50 font-normal ml-2 bg-primary/10 px-2 py-0.5 rounded-full">HEATMAP</span>
                        </h3>
                        <HeatmapTimeline
                            stopId={selectedStopId}
                            tagesart={selectedTagesart}
                            richtung={selectedRichtung}
                            showDepotRuns={showDepotRuns}
                            targetHeadway={targetHeadway}
                            tolerance={tolerance}
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                        {/* C1: HeadwayChart (improved) */}
                        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary">ssid_chart</span>
                                Takt-Verlauf & Trend
                            </h3>
                            <p className="text-xs text-text-muted mb-4">Einzelwerte + gleitender Durchschnitt (5er-Fenster). Punkte außerhalb des Soll-Korridors sind rot markiert.</p>
                            <div className="flex-1 min-h-[350px]">
                                <HeadwayChart
                                    stopId={selectedStopId}
                                    tagesart={selectedTagesart}
                                    richtung={selectedRichtung}
                                    showDepotRuns={showDepotRuns}
                                    targetHeadway={targetHeadway}
                                    tolerance={tolerance}
                                />
                            </div>
                        </div>

                        {/* C2: BoxplotChart */}
                        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-primary">candlestick_chart</span>
                                Boxplots pro Stunde
                            </h3>
                            <p className="text-xs text-text-muted mb-4">Verteilung der Taktzeiten je Stunde. Kurze Box = stabiler Takt, lange Box = chaotisch.</p>
                            <div className="flex-1 min-h-[350px]">
                                <BoxplotChart
                                    stopId={selectedStopId}
                                    tagesart={selectedTagesart}
                                    richtung={selectedRichtung}
                                    showDepotRuns={showDepotRuns}
                                    targetHeadway={targetHeadway}
                                    tolerance={tolerance}
                                />
                            </div>
                        </div>
                    </div>

                    {/* C3: DeviationChart (full width) */}
                    <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 flex flex-col shadow-lg shadow-black/20">
                        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary">vertical_align_center</span>
                            Abweichung vom Soll-Takt
                        </h3>
                        <p className="text-xs text-text-muted mb-4">
                            Jeder Balken zeigt die Differenz zum Soll-Takt.
                            <span className="text-red-400 ml-1">▲ Rot = Lücke (zu spät)</span>,
                            <span className="text-blue-400 ml-1">▼ Blau = Pulk (zu früh)</span>.
                        </p>
                        <div className="h-[300px] w-full">
                            <DeviationChart
                                stopId={selectedStopId}
                                tagesart={selectedTagesart}
                                richtung={selectedRichtung}
                                showDepotRuns={showDepotRuns}
                                targetHeadway={targetHeadway}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
