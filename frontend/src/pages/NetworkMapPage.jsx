import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Metric, Flex, Badge, Select, SelectItem } from '@tremor/react';
import { LayoutDashboard, Clock, Map as MapIcon, Calendar } from 'lucide-react';
import NetworkMap from '../components/NetworkMap';
import { fetchNetworkNodes, fetchTimetableTagesarten } from '../api';

const TIME_WINDOWS = [
    { label: "Ganzer Tag (00:00 - 24:00)", from: 0, to: 86400 },
    { label: "Morgen-HVZ (06:00 - 09:00)", from: 21600, to: 32400 },
    { label: "Nebenverkehrszeit (09:00 - 16:00)", from: 32400, to: 57600 },
    { label: "Abend-HVZ (16:00 - 19:00)", from: 57600, to: 68400 },
    { label: "Abendverkehr (19:00 - 00:00)", from: 68400, to: 86400 }
];

export default function NetworkMapPage() {
    // State
    const [tagesarten, setTagesarten] = useState([]);
    const [selectedTagesart, setSelectedTagesart] = useState("Mo-Fr");
    const [selectedTimeWindow, setSelectedTimeWindow] = useState("Morgen-HVZ (06:00 - 09:00)");
    const [selectedDirection, setSelectedDirection] = useState("Beide");

    const [networkData, setNetworkData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial load: Tagesarten
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
                console.error("Failed to load tagesarten", err);
            }
        }
        loadTagesarten();
        return () => { isMounted = false; };
    }, []);

    // Load Data
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
                const windowDef = TIME_WINDOWS.find(w => w.label === selectedTimeWindow) || TIME_WINDOWS[0];
                const directionVal = selectedDirection === "Hin" ? 1 : (selectedDirection === "Rück" ? 2 : null);
                const data = await fetchNetworkNodes(selectedTagesart, windowDef.from, windowDef.to, directionVal);

                if (isMounted) {
                    setNetworkData(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError("Fehler beim Laden der Netzdaten: " + err.message);
                    setNetworkData(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        if (selectedTagesart) {
            loadData();
        }

        return () => { isMounted = false; };
    }, [selectedTagesart, selectedTimeWindow, selectedDirection]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <MapIcon className="w-6 h-6 text-indigo-500" />
                        Netzplan Visualisierung
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Abstrakte Darstellung des Netzes basierend auf den Fahrplandaten.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* Tagesart Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <Select value={selectedTagesart} onValueChange={setSelectedTagesart} className="w-32 !text-slate-800 dark:!text-slate-100 font-medium" enableClear={false}>
                            {tagesarten.map(t => (
                                <SelectItem key={t.abbr} value={t.abbr} className="!text-slate-800 dark:!text-slate-100">{t.text}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    {/* Zeitfenster Filter */}
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <Select value={selectedTimeWindow} onValueChange={setSelectedTimeWindow} className="w-64 !text-slate-800 dark:!text-slate-100 font-medium" enableClear={false}>
                            {TIME_WINDOWS.map(w => (
                                <SelectItem key={w.label} value={w.label} className="!text-slate-800 dark:!text-slate-100">{w.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    {/* Richtung Filter */}
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <Select value={selectedDirection} onValueChange={setSelectedDirection} className="w-32 !text-slate-800 dark:!text-slate-100 font-medium" enableClear={false}>
                            <SelectItem value="Beide" className="!text-slate-800 dark:!text-slate-100">Beide</SelectItem>
                            <SelectItem value="Hin" className="!text-slate-800 dark:!text-slate-100">Hinrichtung</SelectItem>
                            <SelectItem value="Rück" className="!text-slate-800 dark:!text-slate-100">Rückrichtung</SelectItem>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Card className="p-0 overflow-hidden shadow-md h-[calc(100vh-200px)] min-h-[600px] flex flex-col relative border-slate-200 dark:border-slate-800">
                <div className="flex-1 w-full h-full relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                            <Text>Netzplan wird berechnet...</Text>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center p-6 text-center">
                            <div>
                                <div className="text-red-500 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <Title className="text-red-500">Ein Fehler ist aufgetreten</Title>
                                <Text>{error}</Text>
                            </div>
                        </div>
                    )}
                    <NetworkMap data={networkData} />
                </div>

                {/* Stats Overlay */}
                {networkData && !isLoading && !error && (
                    <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex gap-6">
                        <div>
                            <Text className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Knoten</Text>
                            <Metric className="text-indigo-600 dark:text-indigo-400">{networkData.nodes.length}</Metric>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 self-center"></div>
                        <div>
                            <Text className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Kanten</Text>
                            <Metric className="text-emerald-600 dark:text-emerald-400">{networkData.edges.length}</Metric>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
