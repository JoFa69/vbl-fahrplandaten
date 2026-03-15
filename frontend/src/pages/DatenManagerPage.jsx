import React, { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsStats, fetchStats, fetchAllStops, fetchRawFiles, fetchRawFilePreview, fetchTableData } from '../api';
import { REMOVABLE_TABLES } from '../components/daten-manager/constants';
import DataViewerModal from '../components/daten-manager/DataViewerModal';
import DbTablesSection from '../components/daten-manager/DbTablesSection';
import RawFilesSection from '../components/daten-manager/RawFilesSection';
import MappingSection from '../components/daten-manager/MappingSection';

const TABS = [
    { key: 'db',      icon: 'storage',      label: 'Datenbank-Tabellen', getCount: (a) => a.activeTables.length },
    { key: 'raw',     icon: 'description',  label: 'VDV 452 Rohdaten',   getCount: (a) => a.rawFiles.length },
    { key: 'mapping', icon: 'account_tree', label: 'Zuordnung',          getCount: () => null },
];

export default function DatenManagerPage() {
    const [stats, setStats] = useState(null);
    const [tableStats, setTableStats] = useState([]);
    const [rawFiles, setRawFiles] = useState([]);
    const [stopCount, setStopCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('db');

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerType, setViewerType] = useState(null);
    const [viewerTitle, setViewerTitle] = useState('');
    const [viewerData, setViewerData] = useState(null);
    const [viewerLoading, setViewerLoading] = useState(false);
    const [viewerPage, setViewerPage] = useState(0);

    useEffect(() => {
        async function loadData() {
            try {
                const [analyticsData, tablesData, stopsData, rawData] = await Promise.all([
                    fetchAnalyticsStats(),
                    fetchStats(),
                    fetchAllStops(),
                    fetchRawFiles(),
                ]);
                setStats(analyticsData);
                setTableStats(tablesData);
                const dimOrtStats = tablesData?.find(t => t.table === 'dim_ort');
                setStopCount(dimOrtStats ? dimOrtStats.rows : (stopsData?.length ?? null));
                setRawFiles(rawData || []);
            } catch (e) {
                console.error('Failed to load data', e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const openTableViewer = useCallback(async (tableName) => {
        setViewerOpen(true);
        setViewerType('table');
        setViewerTitle(tableName);
        setViewerLoading(true);
        setViewerPage(0);
        try {
            setViewerData(await fetchTableData(tableName, 50, 0));
        } catch (e) {
            console.error('Failed to load table data', e);
        } finally {
            setViewerLoading(false);
        }
    }, []);

    const openRawViewer = useCallback(async (file) => {
        setViewerOpen(true);
        setViewerType('raw');
        setViewerTitle(file.filename);
        setViewerLoading(true);
        setViewerPage(0);
        try {
            setViewerData(await fetchRawFilePreview(file.filename, 50, 0));
        } catch (e) {
            console.error('Failed to load raw file', e);
        } finally {
            setViewerLoading(false);
        }
    }, []);

    const loadViewerPage = useCallback(async (page) => {
        if (!viewerTitle) return;
        setViewerLoading(true);
        setViewerPage(page);
        try {
            if (viewerType === 'table') {
                setViewerData(await fetchTableData(viewerTitle, 50, page * 50));
            } else {
                setViewerData(await fetchRawFilePreview(viewerTitle, 50, page * 50));
            }
        } catch (e) {
            console.error('Failed to load page', e);
        } finally {
            setViewerLoading(false);
        }
    }, [viewerTitle, viewerType]);

    const closeViewer = () => {
        setViewerOpen(false);
        setViewerData(null);
        setViewerType(null);
    };

    const activeTables = tableStats.filter(t => !REMOVABLE_TABLES.has(t.table));
    const emptyTables = tableStats.filter(t => REMOVABLE_TABLES.has(t.table));
    const totalRawRecords = rawFiles.reduce((acc, f) => acc + (f.lines || 0), 0);

    const kpis = [
        { label: 'LINIEN GESAMT',   value: stats?.total_lines?.value ?? '—',                                                          icon: 'route',         color: 'text-blue-400' },
        { label: 'AKTIVE FAHRTEN',  value: stats?.total_planned_trips?.value ? Number(stats.total_planned_trips.value).toLocaleString('de-DE') : '—', icon: 'directions_bus', color: 'text-emerald-400' },
        { label: 'HALTEPUNKTE',     value: stopCount !== null ? stopCount.toLocaleString('de-DE') : '—',                              icon: 'location_on',   color: 'text-amber-400' },
        { label: 'VDV 452 DATEIEN', value: rawFiles.length || '—',                                                                    icon: 'folder_open',   color: 'text-purple-400' },
    ];

    const tabCounts = { activeTables, rawFiles };

    return (
        <div className="flex flex-col flex-1 overflow-hidden h-full">
            {/* KPI Cards */}
            <div className="p-6 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-slate-900 border border-border-dark p-5 rounded-xl transition-all hover:border-primary/50 group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{kpi.label}</span>
                                <span className={`material-symbols-outlined ${kpi.color} group-hover:scale-110 transition-transform`}>{kpi.icon}</span>
                            </div>
                            <span className="text-3xl font-black text-white">{kpi.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6">
                <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
                    {TABS.map(tab => {
                        const count = tab.getCount(tabCounts);
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-slate-200'}`}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                                {count !== null && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-700'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === 'db' && (
                    <DbTablesSection
                        activeTables={activeTables}
                        emptyTables={emptyTables}
                        loading={loading}
                        onOpenTable={openTableViewer}
                    />
                )}
                {activeTab === 'raw' && (
                    <RawFilesSection
                        rawFiles={rawFiles}
                        loading={loading}
                        onOpenFile={openRawViewer}
                        totalRawRecords={totalRawRecords}
                    />
                )}
                {activeTab === 'mapping' && (
                    <MappingSection tableStats={tableStats} />
                )}
            </div>

            <DataViewerModal
                open={viewerOpen}
                onClose={closeViewer}
                type={viewerType}
                title={viewerTitle}
                data={viewerData}
                loading={viewerLoading}
                page={viewerPage}
                onLoadPage={loadViewerPage}
            />
        </div>
    );
}
