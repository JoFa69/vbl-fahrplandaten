import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Metric, Grid, BadgeDelta, Flex, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@tremor/react";
import { ClockIcon, MapIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';

const TAGESART_TABS = ['Alle', 'Mo-Fr', 'Sa', 'So/Ft'];

const UmlaufPage = () => {
    const [summary, setSummary] = useState(null);
    const [umlaeufe, setUmlaeufe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagesart, setTagesart] = useState('Alle');

    // Format utility functions
    const formatTime = (seconds) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const formatNumber = (num, decimals = 0) => {
        return new Intl.NumberFormat('de-CH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Summary
                const summaryRes = await fetch(`http://localhost:8000/api/umlaeufe/summary?tagesart=${tagesart}`);
                if (!summaryRes.ok) throw new Error('Failed to fetch summary');
                const summaryData = await summaryRes.json();
                setSummary(summaryData);

                // Fetch List (we get the first 1000 items as we have ~165 total based on backend test)
                const listRes = await fetch(`http://localhost:8000/api/umlaeufe?page=1&size=1000&tagesart=${tagesart}`);
                if (!listRes.ok) throw new Error('Failed to fetch umläufe list');
                const listData = await listRes.json();
                setUmlaeufe(listData.data || []);
            } catch (err) {
                console.error("Error fetching Umlauf data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tagesart]);

    if (loading) return <div className="text-gray-400 p-4">Lade Umlauf-Daten...</div>;
    if (error) return <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">Fehler beim Laden: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Umlauf-Übersicht
                    </h1>
                    <p className="text-gray-400">
                        Analyse der Fahrzeugumläufe basierend auf geplanten Fahrten und Strecken.
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

            {/* KPI Section */}
            {summary && (
                <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
                    <Card decoration="top" decorationColor="blue" className="bg-gray-900 border-gray-800">
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text className="text-gray-400">Aktive Umläufe</Text>
                                <Metric className="text-white mt-2">{formatNumber(summary.total_umlaeufe)}</Metric>
                            </div>
                            <TagIcon className="h-8 w-8 text-blue-500 opacity-80" />
                        </Flex>
                    </Card>
                    <Card decoration="top" decorationColor="emerald" className="bg-gray-900 border-gray-800">
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text className="text-gray-400">Ø Dauer pro Umlauf</Text>
                                <Metric className="text-white mt-2">{formatNumber(summary.avg_dauer_minuten / 60, 1)} h</Metric>
                            </div>
                            <ClockIcon className="h-8 w-8 text-emerald-500 opacity-80" />
                        </Flex>
                    </Card>
                    <Card decoration="top" decorationColor="amber" className="bg-gray-900 border-gray-800">
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text className="text-gray-400">Total zugewiesene Fahrten</Text>
                                <Metric className="text-white mt-2">{formatNumber(summary.total_fahrten)}</Metric>
                            </div>
                            <ChartBarIcon className="h-8 w-8 text-amber-500 opacity-80" />
                        </Flex>
                    </Card>
                    <Card decoration="top" decorationColor="purple" className="bg-gray-900 border-gray-800">
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text className="text-gray-400">Gesamtdistanz (Plan)</Text>
                                <Metric className="text-white mt-2">{formatNumber(summary.total_distanz_km)} km</Metric>
                            </div>
                            <MapIcon className="h-8 w-8 text-purple-500 opacity-80" />
                        </Flex>
                    </Card>
                </Grid>
            )}

            {/* Table Section */}
            <Card className="bg-gray-900 border-gray-800">
                <Title className="text-white mb-4">Alle Umläufe ({umlaeufe.length})</Title>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHead>
                            <TableRow className="border-b border-gray-800">
                                <TableHeaderCell className="text-gray-400 font-semibold bg-gray-900/50">Umlauf ID</TableHeaderCell>
                                <TableHeaderCell className="text-gray-400 font-semibold text-right bg-gray-900/50">Anzahl Fahrten</TableHeaderCell>
                                <TableHeaderCell className="text-gray-400 font-semibold bg-gray-900/50">Erste Abfahrt</TableHeaderCell>
                                <TableHeaderCell className="text-gray-400 font-semibold bg-gray-900/50">Letzte Ankunft</TableHeaderCell>
                                <TableHeaderCell className="text-gray-400 font-semibold text-right bg-gray-900/50">Dauer (Std.)</TableHeaderCell>
                                <TableHeaderCell className="text-gray-400 font-semibold text-right bg-gray-900/50">Distanz (km)</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {umlaeufe.map((item) => (
                                <TableRow key={item.umlauf_id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800/50">
                                    <TableCell className="text-white font-medium">#{item.umlauf_id}</TableCell>
                                    <TableCell className="text-right text-gray-300">
                                        <BadgeDelta deltaType={item.anzahl_fahrten > 50 ? 'increase' : 'unchanged'} size="xs" />
                                        <span className="ml-2">{formatNumber(item.anzahl_fahrten)}</span>
                                    </TableCell>
                                    <TableCell className="text-gray-300 text-sm">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                            {formatTime(item.start_zeit_sekunden)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-300 text-sm">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
                                            {formatTime(item.ende_zeit_sekunden)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-300 font-mono text-sm">
                                        {formatNumber(item.dauer_stunden, 1)} h
                                    </TableCell>
                                    <TableCell className="text-right text-gray-300 font-mono text-sm">
                                        <span className="text-blue-400">{formatNumber(item.distanz_km, 1)}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default UmlaufPage;
