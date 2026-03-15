import React from 'react';

const TABLE_REASONS = {
    'cub_agg_raw_data': 'Aggregierte Nachfragedaten – leer',
    'cub_raw_data': 'Rohe Nachfragedaten – leer',
    'dim_vehicle': 'Fahrzeugstammdaten – keine Quelldaten',
    'raw_data': 'Import-Zwischentabelle – leer',
    'proc_etlrun': 'ETL-Metadaten – kein Analyse-Nutzen',
};

function tableTypeBadge(name) {
    if (name.startsWith('dim_')) return { label: 'Dimension', css: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (name.startsWith('cub_')) return { label: 'Fakten',    css: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    if (name.startsWith('proc_')) return { label: 'Prozess',  css: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    if (name.startsWith('raw_')) return { label: 'Rohdaten',  css: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    if (name.startsWith('edit_')) return { label: 'Regelwerk', css: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    return { label: 'Sonstige', css: 'bg-slate-700 text-slate-300 border-slate-600' };
}

export default function DbTablesSection({ activeTables, emptyTables, loading, onOpenTable }) {
    return (
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
                                    const { label, css } = tableTypeBadge(t.table);
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
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${css}`}>{label}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => onOpenTable(t.table)}
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

            {/* Empty/Removable tables */}
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
                                {emptyTables.map((t) => (
                                    <tr key={t.table} className="group hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="text-sm font-mono text-slate-400 line-through opacity-70">{t.table}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-xs font-mono text-slate-500">{t.rows}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-xs text-orange-300/70">
                                                {TABLE_REASONS[t.table] || 'Leer / nicht benötigt'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => onOpenTable(t.table)}
                                                className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
                                            >
                                                Inspizieren
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
