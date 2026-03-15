import React from 'react';

export default function DataViewerModal({ open, onClose, type, title, data, loading, page, onLoadPage }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-slate-900 border border-border-dark rounded-2xl shadow-2xl w-[90vw] max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                            {type === 'table' ? 'table_chart' : 'grid_view'}
                        </span>
                        <div>
                            <h3 className="text-md font-bold text-white font-mono">
                                {type === 'raw' && data?.table_name
                                    ? `${data.table_name} (${title})`
                                    : title}
                            </h3>
                            {data && (
                                <div className="flex items-center gap-3 mt-0.5">
                                    <p className="text-xs text-text-muted">
                                        {data.total_count?.toLocaleString('de-DE')} Datensätze · {data.columns?.length} Spalten
                                        {data.total_count > 50 && ` · Seite ${page + 1} von ${Math.ceil(data.total_count / 50)}`}
                                    </p>
                                    {type === 'raw' && data.meta && (
                                        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                            {data.meta.source} · {data.meta.export_date}
                                        </span>
                                    )}
                                </div>
                            )}
                            {type === 'raw' && data?.column_info && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {data.column_info.map(ci => (
                                        <span key={ci.name} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 border border-slate-700/50">
                                            {ci.name}: <span className="text-slate-400">{ci.type}</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                <span className="text-sm text-text-muted">Lade Daten...</span>
                            </div>
                        </div>
                    ) : data?.columns ? (
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-800">
                                    {data.columns.map((col) => (
                                        <th key={col} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.data?.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        {data.columns.map((col) => (
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
                {data && data.total_count > 50 && (
                    <div className="px-6 py-3 border-t border-border-dark flex items-center justify-between shrink-0 bg-slate-800/30">
                        <span className="text-xs text-text-muted">
                            Zeige {page * 50 + 1}–{Math.min((page + 1) * 50, data.total_count)} von {data.total_count.toLocaleString('de-DE')}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onLoadPage(page - 1)}
                                disabled={page === 0}
                                className="px-3 py-1.5 text-xs bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Zurück
                            </button>
                            <span className="text-xs text-text-muted font-mono px-2">
                                {page + 1} / {Math.ceil(data.total_count / 50)}
                            </span>
                            <button
                                onClick={() => onLoadPage(page + 1)}
                                disabled={(page + 1) * 50 >= data.total_count}
                                className="px-3 py-1.5 text-xs bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Weiter →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
