import React from 'react';
import { VDV_DB_MAPPING, REMOVABLE_TABLES } from './constants';

export default function MappingSection({ tableStats }) {
    const allMappedDb = new Set(VDV_DB_MAPPING.flatMap(m => m.db));

    const dbMap = {};
    VDV_DB_MAPPING.forEach(m => {
        m.db.forEach(db => {
            if (!dbMap[db]) dbMap[db] = [];
            dbMap[db].push(m.raw);
        });
    });

    const unmappedTables = tableStats.filter(
        t => !allMappedDb.has(t.table) && !REMOVABLE_TABLES.has(t.table)
    );

    return (
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
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-start">
                        {/* LEFT: Raw files */}
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

                        {/* RIGHT: DB tables */}
                        <div>
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">storage</span>
                                DuckDB Tabellen
                            </div>
                            <div className="space-y-1.5">
                                {Object.entries(dbMap).map(([db, sources]) => {
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
                                })}
                            </div>
                            {unmappedTables.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-800">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Weitere DB-Tabellen (nicht aus VDV)
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {unmappedTables.map(t => (
                                            <span key={t.table} className="px-2 py-1 text-[10px] font-mono rounded bg-slate-800/50 text-slate-400 border border-slate-700/50">
                                                {t.table} <span className="text-slate-600">({Number(t.rows).toLocaleString('de-DE')})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
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
    );
}
