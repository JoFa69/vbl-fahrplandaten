import React, { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsStats, fetchStats, fetchAllStops, fetchRawFiles, fetchRawFilePreview, fetchTableData } from '../api';

// VDV 452 → DB Mapping data
const VDV_DB_MAPPING = [
    { raw: 'rec_frt.x10', db: ['cub_schedule', 'dim_fahrt'], desc: 'Fahrten' },
    { raw: 'rec_frt_hzt.x10', db: ['cub_route'], desc: 'Fahrt-Haltezeiten' },
    { raw: 'rec_lid.x10', db: ['dim_line'], desc: 'Linien' },
    { raw: 'rec_ort.x10', db: ['dim_ort'], desc: 'Haltestellen' },
    { raw: 'lid_verlauf.x10', db: ['dim_route', 'cub_route'], desc: 'Linienverlauf' },
    { raw: 'sel_fzt_feld.x10', db: ['cub_route'], desc: 'Fahrzeitfelder' },
    { raw: 'firmenkalender.x10', db: ['dim_date'], desc: 'Kalender' },
    { raw: 'rec_umlauf.x10', db: ['dim_umlauf'], desc: 'Umläufe' },
    { raw: 'rec_hp.x10', db: ['dim_ort'], desc: 'Haltepunkte' },
    { raw: 'rec_sel.x10', db: ['cub_schedule'], desc: 'Selektionen' },
    { raw: 'rec_sel_zp.x10', db: ['dim_time'], desc: 'Zeitprofile' },
    { raw: 'rec_znr.x10', db: ['dim_time'], desc: 'Zeitprofilnummern' },
    { raw: 'menge_tagesart.x10', db: ['dim_date'], desc: 'Tagesarten' },
    { raw: 'menge_fgr.x10', db: [], desc: 'Fahrgastgruppen' },
    { raw: 'menge_fahrtart.x10', db: [], desc: 'Fahrtarten' },
    { raw: 'menge_fzg_typ.x10', db: [], desc: 'Fahrzeugtypen' },
    { raw: 'menge_bereich.x10', db: [], desc: 'Bereiche' },
    { raw: 'menge_onr_typ.x10', db: [], desc: 'Ortsnummerntypen' },
    { raw: 'menge_ort_typ.x10', db: [], desc: 'Ortstypen' },
    { raw: 'basis_ver_gueltigkeit.x10', db: [], desc: 'Versionen' },
    { raw: 'menge_basis_versionen.x10', db: [], desc: 'Basisversionen' },
];

// Tables that can be removed (empty / not needed for schedule analysis)
const REMOVABLE_TABLES = new Set([
    'cub_agg_raw_data', 'cub_raw_data', 'dim_vehicle', 'raw_data', 'proc_etlrun'
]);

export default function DatenManagerPage() {
    const [stats, setStats] = useState(null);
    const [tableStats, setTableStats] = useState([]);
    const [rawFiles, setRawFiles] = useState([]);
    const [stopCount, setStopCount] = useState(null);
    const [loading, setLoading] = useState(true);

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerType, setViewerType] = useState(null); // 'table' | 'raw'
    const [viewerTitle, setViewerTitle] = useState('');
    const [viewerData, setViewerData] = useState(null);
    const [viewerLoading, setViewerLoading] = useState(false);
    const [viewerPage, setViewerPage] = useState(0);

    // Section toggle
    const [activeTab, setActiveTab] = useState('db'); // 'db' | 'raw' | 'mapping'

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

                // Use dim_ort count for stops if available, otherwise fallback to stopsData length
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

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Number of records in raw files
    const totalRawRecords = rawFiles.reduce((acc, f) => acc + (f.lines || 0), 0);

    // Open DB table viewer
    const openTableViewer = useCallback(async (tableName) => {
        setViewerOpen(true);
        setViewerType('table');
        setViewerTitle(tableName);
        setViewerLoading(true);
        setViewerPage(0);
        try {
            const data = await fetchTableData(tableName, 50, 0);
            setViewerData(data);
        } catch (e) {
            console.error('Failed to load table data', e);
        } finally {
            setViewerLoading(false);
        }
    }, []);

    // Paginate table viewer
    const loadTablePage = useCallback(async (page) => {
        if (!viewerTitle) return;
        setViewerLoading(true);
        setViewerPage(page);
        try {
            if (viewerType === 'table') {
                const data = await fetchTableData(viewerTitle, 50, page * 50);
                setViewerData(data);
            } else if (viewerType === 'raw') {
                const data = await fetchRawFilePreview(viewerTitle, 50, page * 50);
                setViewerData(data);
            }
        } catch (e) {
            console.error('Failed to load page', e);
        } finally {
            setViewerLoading(false);
        }
    }, [viewerTitle, viewerType]);

    // Open raw file preview (as structured table)
    const openRawViewer = useCallback(async (file) => {
        setViewerOpen(true);
        setViewerType('raw');
        setViewerTitle(file.filename);
        setViewerLoading(true);
        setViewerPage(0);
        try {
            const data = await fetchRawFilePreview(file.filename, 50, 0);
            setViewerData(data);
        } catch (e) {
            console.error('Failed to load raw file', e);
        } finally {
            setViewerLoading(false);
        }
    }, []);

    const closeViewer = () => {
        setViewerOpen(false);
        setViewerData(null);
        setViewerType(null);
    };

    const kpis = [
        {
            label: 'LINIEN GESAMT',
            value: stats?.total_lines?.value ?? '—',
            icon: 'route',
            color: 'text-blue-400',
        },
        {
            label: 'AKTIVE FAHRTEN',
            value: stats?.total_planned_trips?.value
                ? Number(stats.total_planned_trips.value).toLocaleString('de-DE')
                : '—',
            icon: 'directions_bus',
            color: 'text-emerald-400',
        },
        {
            label: 'HALTEPUNKTE',
            value: stopCount !== null ? stopCount.toLocaleString('de-DE') : '—',
            icon: 'location_on',
            color: 'text-amber-400',
        },
        {
            label: 'VDV 452 DATEIEN',
            value: rawFiles.length || '—',
            icon: 'folder_open',
            color: 'text-purple-400',
        },
    ];

    const totalDbRows = tableStats.reduce((acc, t) => acc + t.rows, 0);
    const activeTables = tableStats.filter(t => !REMOVABLE_TABLES.has(t.table));
    const emptyTables = tableStats.filter(t => REMOVABLE_TABLES.has(t.table));

    return (
        <div className="flex flex-col flex-1 overflow-hidden h-full">
            {/* KPI Section */}
            <div className="p-6 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 border border-border-dark p-5 rounded-xl transition-all hover:border-primary/50 group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                                    {kpi.label}
                                </span>
                                <span className={`material-symbols-outlined ${kpi.color} group-hover:scale-110 transition-transform`}>
                                    {kpi.icon}
                                </span>
                            </div>
                            <span className="text-3xl font-black text-white">{kpi.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6">
                <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
                    {[
                        { key: 'db', icon: 'storage', label: 'Datenbank-Tabellen', count: activeTables.length },
                        { key: 'raw', icon: 'description', label: 'VDV 452 Rohdaten', count: rawFiles.length },
                        { key: 'mapping', icon: 'account_tree', label: 'Zuordnung', count: null },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.key
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-muted hover:text-slate-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-700'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === 'db' ? (
                    /* ═══════ DB TABLES ═══════ */
                    <div className="space-y-6">
                        {/* Active tables */}
                        <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-dark">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted">storage</span>
                                    Aktive Tabellen
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    {activeTables.reduce((a, t) => a + t.rows, 0).toLocaleString('de-DE')} Zeilen in {activeTables.length} Tabellen
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50 text-text-muted">
                                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Tabelle</th>
                                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Zeilen</th>
                                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Spalten</th>
                                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Typ</th>
                                            <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            activeTables.map((t) => {
                                                const isDim = t.table.startsWith('dim_');
                                                const isCub = t.table.startsWith('cub_');
                                                const isProc = t.table.startsWith('proc_');
                                                const isRaw = t.table.startsWith('raw_');
                                                const isEdit = t.table.startsWith('edit_');
                                                let typeLabel, typeBgColor;
                                                if (isDim) { typeLabel = 'Dimension'; typeBgColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; }
                                                else if (isCub) { typeLabel = 'Fakten'; typeBgColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20'; }
                                                else if (isProc) { typeLabel = 'Prozess'; typeBgColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20'; }
                                                else if (isRaw) { typeLabel = 'Rohdaten'; typeBgColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20'; }
                                                else if (isEdit) { typeLabel = 'Regelwerk'; typeBgColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20'; }
                                                else { typeLabel = 'Sonstige'; typeBgColor = 'bg-slate-700 text-slate-300 border-slate-600'; }

                                                return (
                                                    <tr key={t.table} className="group hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <span className="text-sm font-semibold text-slate-100 font-mono">{t.table}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="text-xs font-bold text-slate-200 font-mono">
                                                                {Number(t.rows).toLocaleString('de-DE')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="text-xs text-slate-400 font-mono">{t.columns || '—'}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeBgColor}`}>
                                                                {typeLabel}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => openTableViewer(t.table)}
                                                                className="text-primary hover:text-blue-300 text-xs font-bold whitespace-nowrap transition-colors"
                                                            >
                                                                Daten ansehen →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Empty/Removable Tables */}
                        {emptyTables.length > 0 && (
                            <div className="bg-slate-900/50 border border-orange-500/20 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-orange-500/10 bg-orange-500/5">
                                    <h3 className="text-md font-bold text-orange-400 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-orange-500">warning</span>
                                        Nicht benötigte Tabellen
                                    </h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        Diese Tabellen sind leer oder gehören zum Nachfrage-Modul, das hier nicht verwendet wird.
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/30 text-text-muted">
                                                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Tabelle</th>
                                                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Zeilen</th>
                                                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Grund</th>
                                                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Aktionen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {emptyTables.map((t) => {
                                                const reasons = {
                                                    'cub_agg_raw_data': 'Aggregierte Nachfragedaten – leer',
                                                    'cub_raw_data': 'Rohe Nachfragedaten – leer',
                                                    'dim_vehicle': 'Fahrzeugstammdaten – keine Quelldaten',
                                                    'raw_data': 'Import-Zwischentabelle – leer',
                                                    'proc_etlrun': 'ETL-Metadaten – kein Analyse-Nutzen',
                                                };
                                                return (
                                                    <tr key={t.table} className="group hover:bg-slate-800/20 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <span className="text-sm font-mono text-slate-400 line-through opacity-70">{t.table}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="text-xs font-mono text-slate-500">{t.rows}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className="text-xs text-orange-300/70">{reasons[t.table] || 'Leer / nicht benötigt'}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => openTableViewer(t.table)}
                                                                className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
                                                            >
                                                                Inspizieren
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'raw' ? (
                    /* ═══════ RAW VDV FILES ═══════ */
                    <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
                            <div>
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted">description</span>
                                    VDV 452 Rohdateien (.x10)
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    Originale Quelldateien aus dem Fahrplan-Export · {totalRawRecords.toLocaleString('de-DE')} Zeilen total
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted bg-slate-800/50 px-3 py-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-sm">info</span>
                                VDV 452 · DIVA Export · ISO-8859-1
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 text-text-muted">
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Datei</th>
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Beschreibung</th>
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">→ DB-Tabelle</th>
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Datensätze</th>
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Grösse</th>
                                        <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                                                <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                            </td>
                                        </tr>
                                    ) : rawFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-text-muted text-sm">
                                                Keine VDV-Dateien im data/ Verzeichnis gefunden
                                            </td>
                                        </tr>
                                    ) : (
                                        rawFiles.map((f) => {
                                            const mapping = VDV_DB_MAPPING.find(m => m.raw === f.filename);
                                            const dbTables = mapping?.db || [];
                                            const isCritical = ['rec_frt', 'rec_frt_hzt', 'lid_verlauf', 'rec_ort', 'sel_fzt_feld'].includes(f.name);
                                            return (
                                                <tr key={f.filename} className="group hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`material-symbols-outlined text-sm ${isCritical ? 'text-amber-400' : 'text-slate-500'}`}>
                                                                {isCritical ? 'star' : 'draft'}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-100 font-mono">{f.filename}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-xs text-slate-400">{f.description}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {dbTables.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {dbTables.map(t => (
                                                                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-600">— Stammdaten</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="text-xs font-mono text-slate-300">
                                                            {f.lines.toLocaleString('de-DE')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="text-xs text-slate-400 font-mono">{formatSize(f.size)}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button
                                                            onClick={() => openRawViewer(f)}
                                                            className="text-primary hover:text-blue-300 text-xs font-bold whitespace-nowrap transition-colors"
                                                        >
                                                            Tabelle ansehen →
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ═══════ MAPPING DIAGRAM ═══════ */
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-dark">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-muted">account_tree</span>
                                    Daten-Pipeline: VDV 452 → DuckDB
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    Zuordnung der Rohdateien zu den aufbereiteten Datenbank-Tabellen
                                </p>
                            </div>

                            <div className="p-6">
                                {/* Pipeline Visualization */}
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-start">
                                    {/* LEFT: Raw Files */}
                                    <div>
                                        <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">description</span>
                                            VDV 452 Quelldateien
                                        </div>
                                        <div className="space-y-1.5">
                                            {VDV_DB_MAPPING.filter(m => m.db.length > 0).map(m => (
                                                <div key={m.raw} className="flex items-center gap-2 bg-purple-500/5 border border-purple-500/15 rounded-lg px-3 py-2 group hover:border-purple-500/30 transition-colors">
                                                    <span className="material-symbols-outlined text-purple-400 text-sm">draft</span>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs font-mono text-purple-300 font-semibold">{m.raw}</span>
                                                        <span className="text-[10px] text-slate-500 ml-2">{m.desc}</span>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Unmapped files */}
                                        <div className="mt-4 pt-3 border-t border-slate-800">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Stammdaten (kein DB-Mapping)
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {VDV_DB_MAPPING.filter(m => m.db.length === 0).map(m => (
                                                    <span key={m.raw} className="px-2 py-1 text-[10px] font-mono rounded bg-slate-800/50 text-slate-500 border border-slate-700/50">
                                                        {m.raw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CENTER: Pipeline */}
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <div className="w-px h-8 bg-gradient-to-b from-transparent to-emerald-500/50" />
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
                                            <span className="material-symbols-outlined text-emerald-400 text-2xl">bolt</span>
                                            <p className="text-[10px] font-bold text-emerald-400 mt-1">import_vdv.py</p>
                                            <p className="text-[9px] text-slate-500">Parse · Transform · Load</p>
                                        </div>
                                        <div className="w-px h-8 bg-gradient-to-b from-emerald-500/50 to-transparent" />
                                    </div>

                                    {/* RIGHT: DB Tables */}
                                    <div>
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">storage</span>
                                            DuckDB Tabellen
                                        </div>
                                        <div className="space-y-1.5">
                                            {(() => {
                                                // Collect all unique DB tables from mapping
                                                const dbMap = {};
                                                VDV_DB_MAPPING.forEach(m => {
                                                    m.db.forEach(db => {
                                                        if (!dbMap[db]) dbMap[db] = [];
                                                        dbMap[db].push(m.raw);
                                                    });
                                                });
                                                return Object.entries(dbMap).map(([db, sources]) => {
                                                    const tstat = tableStats.find(t => t.table === db);
                                                    const isDim = db.startsWith('dim_');
                                                    return (
                                                        <div key={db} className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2 hover:border-blue-500/30 transition-colors">
                                                            <span className="material-symbols-outlined text-blue-400 text-sm">
                                                                {isDim ? 'category' : 'grid_view'}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-xs font-mono text-blue-300 font-semibold">{db}</span>
                                                                {tstat && (
                                                                    <span className="text-[10px] text-slate-500 ml-2">
                                                                        {Number(tstat.rows).toLocaleString('de-DE')} Zeilen
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {sources.map(s => (
                                                                    <span key={s} className="w-1.5 h-1.5 rounded-full bg-purple-400/50" title={s} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        {/* Tables not from VDV */}
                                        <div className="mt-4 pt-3 border-t border-slate-800">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Weitere DB-Tabellen (nicht aus VDV)
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tableStats
                                                    .filter(t => {
                                                        const allMappedDb = new Set();
                                                        VDV_DB_MAPPING.forEach(m => m.db.forEach(d => allMappedDb.add(d)));
                                                        return !allMappedDb.has(t.table) && !REMOVABLE_TABLES.has(t.table);
                                                    })
                                                    .map(t => (
                                                        <span key={t.table} className="px-2 py-1 text-[10px] font-mono rounded bg-slate-800/50 text-slate-400 border border-slate-700/50">
                                                            {t.table} <span className="text-slate-600">({Number(t.rows).toLocaleString('de-DE')})</span>
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl flex items-start gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                                    <span className="material-symbols-outlined">info</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">VDV 452 Spezifikation</h4>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        DIVA Export v19.75 · ÖPNV-Datenmodell 5.0/1.5 · ISO-8859-1 Encoding.
                                        Exportdatum: 22.01.2026 · Gültigkeit: Fahrplanperiode 2027.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 border border-border-dark p-5 rounded-xl flex items-start gap-4">
                                <div className="p-3 bg-slate-800 text-text-muted rounded-lg shrink-0">
                                    <span className="material-symbols-outlined">sync</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Daten-Pipeline</h4>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Rohdaten (.x10) → import_vdv.py → DuckDB.
                                        Koordinaten: VDV DMS → WGS84 (EPSG:4326).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ DATA VIEWER MODAL ═══════ */}
            {viewerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeViewer} />

                    {/* Modal */}
                    <div className="relative bg-slate-900 border border-border-dark rounded-2xl shadow-2xl w-[90vw] max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">
                                    {viewerType === 'table' ? 'table_chart' : 'grid_view'}
                                </span>
                                <div>
                                    <h3 className="text-md font-bold text-white font-mono">
                                        {viewerType === 'raw' && viewerData?.table_name
                                            ? `${viewerData.table_name} (${viewerTitle})`
                                            : viewerTitle}
                                    </h3>
                                    {viewerData && (
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <p className="text-xs text-text-muted">
                                                {viewerData.total_count?.toLocaleString('de-DE')} Datensätze · {viewerData.columns?.length} Spalten
                                                {viewerData.total_count > 50 && ` · Seite ${viewerPage + 1} von ${Math.ceil(viewerData.total_count / 50)}`}
                                            </p>
                                            {viewerType === 'raw' && viewerData.meta && (
                                                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                                    {viewerData.meta.source} · {viewerData.meta.export_date}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Column type info for raw files */}
                                    {viewerType === 'raw' && viewerData?.column_info && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {viewerData.column_info.map(ci => (
                                                <span key={ci.name} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 border border-slate-700/50">
                                                    {ci.name}: <span className="text-slate-400">{ci.type}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={closeViewer}
                                className="p-2 text-text-muted hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {viewerLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                        <span className="text-sm text-text-muted">Lade Daten...</span>
                                    </div>
                                </div>
                            ) : viewerData && viewerData.columns ? (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-slate-800">
                                            {viewerData.columns.map((col) => (
                                                <th key={col} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {viewerData.data?.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                {viewerData.columns.map((col) => (
                                                    <td key={col} className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap max-w-[300px] truncate">
                                                        {row[col] !== null && row[col] !== undefined && row[col] !== ''
                                                            ? String(row[col])
                                                            : <span className="text-slate-600 italic">null</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex items-center justify-center py-16 text-text-muted text-sm">
                                    Keine Daten verfügbar
                                </div>
                            )}
                        </div>

                        {/* Footer / Pagination */}
                        {viewerData && viewerData.total_count > 50 && (
                            <div className="px-6 py-3 border-t border-border-dark flex items-center justify-between shrink-0 bg-slate-800/30">
                                <span className="text-xs text-text-muted">
                                    Zeige {viewerPage * 50 + 1}–{Math.min((viewerPage + 1) * 50, viewerData.total_count)} von {viewerData.total_count.toLocaleString('de-DE')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => loadTablePage(viewerPage - 1)}
                                        disabled={viewerPage === 0}
                                        className="px-3 py-1.5 text-xs bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Zurück
                                    </button>
                                    <span className="text-xs text-text-muted font-mono px-2">
                                        {viewerPage + 1} / {Math.ceil(viewerData.total_count / 50)}
                                    </span>
                                    <button
                                        onClick={() => loadTablePage(viewerPage + 1)}
                                        disabled={(viewerPage + 1) * 50 >= viewerData.total_count}
                                        className="px-3 py-1.5 text-xs bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Weiter →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
