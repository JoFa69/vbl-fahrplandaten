import React from 'react';
import { VDV_DB_MAPPING } from './constants';

const CRITICAL_FILES = new Set(['rec_frt', 'rec_frt_hzt', 'lid_verlauf', 'rec_ort', 'sel_fzt_feld']);

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RawFilesSection({ rawFiles, loading, onOpenFile, totalRawRecords }) {
    return (
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
                                const isCritical = CRITICAL_FILES.has(f.name);
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
                                                onClick={() => onOpenFile(f)}
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
    );
}
