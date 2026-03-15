import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';

// ─── Helper Components ───────────────────────────────────────────────────
function ColumnFilter({ column }) {
    const value = column.getFilterValue() ?? '';
    return (
        <input
            value={value}
            onChange={(e) => column.setFilterValue(e.target.value || undefined)}
            placeholder="Filter…"
            className="w-full px-2 py-1 text-[11px] bg-slate-900/80 border border-slate-700 rounded text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
        />
    );
}

function SortIcon({ isSorted }) {
    if (!isSorted) {
        return <span className="material-symbols-outlined text-[14px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">unfold_more</span>;
    }
    return (
        <span className="material-symbols-outlined text-[14px] text-primary">
            {isSorted === 'asc' ? 'arrow_upward' : 'arrow_downward'}
        </span>
    );
}

function SortableHeader({ header, children, align = 'left' }) {
    const canSort = header.column.getCanSort();
    return (
        <div
            className={`flex items-center gap-1 select-none ${align === 'right' ? 'justify-end' : ''} ${canSort ? 'cursor-pointer group' : ''}`}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
        >
            {align === 'right' && <SortIcon isSorted={header.column.getIsSorted()} />}
            <span>{children}</span>
            {align !== 'right' && <SortIcon isSorted={header.column.getIsSorted()} />}
        </div>
    );
}

function dirBadge(dir) {
    const d = String(dir);
    if (d === '1') return { label: 'Hin', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (d === '2') return { label: 'Rück', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    return { label: `R${d}`, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
}

// ─── NetworkLeftPanel ────────────────────────────────────────────────────
export default function NetworkLeftPanel({
    level,
    selectedLine,
    selectedVariant,
    selectedFahrtart,
    setSelectedFahrtart,
    loading,
    variantsLoading,
    lines,
    variants,
    handleLineClick,
    handleVariantClick,
    handleBackToLines,
}) {
    const [linesSorting, setLinesSorting] = useState([]);
    const [variantsSorting, setVariantsSorting] = useState([]);

    const linesColumns = useMemo(() => [
        {
            accessorKey: 'line_no',
            header: 'Linie',
            size: 80,
            enableColumnFilter: true,
            sortingFn: (rowA, rowB) => {
                const a = parseInt(rowA.original.line_no) || 0;
                const b = parseInt(rowB.original.line_no) || 0;
                return a - b;
            },
            cell: ({ getValue }) => (
                <span className="px-2.5 py-1 rounded bg-slate-800 text-white text-xs font-bold border border-slate-600 group-hover:border-primary/50 transition-colors">
                    {getValue()}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Bezeichnung',
            enableColumnFilter: true,
            cell: ({ getValue }) => (
                <span className="text-sm text-slate-200">{getValue() || '—'}</span>
            ),
        },
        {
            accessorKey: 'variants',
            header: 'Varianten',
            size: 90,
            enableColumnFilter: false,
            meta: { align: 'right' },
            cell: ({ getValue }) => (
                <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-400 font-mono">{getValue()}</span>
                    <span className="material-symbols-outlined text-slate-500 text-sm group-hover:text-primary transition-colors">
                        chevron_right
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'trips',
            header: 'Fahrten',
            size: 80,
            enableColumnFilter: false,
            meta: { align: 'right' },
            cell: ({ getValue }) => (
                <span className="text-xs text-slate-400 font-mono">{getValue()}</span>
            ),
        },
    ], []);

    const variantsColumns = useMemo(() => [
        {
            accessorKey: 'variant_no',
            header: 'Var',
            size: 60,
            enableColumnFilter: false,
            sortingFn: (rowA, rowB) => {
                const a = parseInt(rowA.original.variant_no) || 0;
                const b = parseInt(rowB.original.variant_no) || 0;
                return a - b;
            },
            cell: ({ row, getValue }) => {
                const isSelected = selectedVariant?.id === row.original.id;
                return (
                    <div className="flex items-center gap-2">
                        <div className={`h-5 w-1 rounded-full ${isSelected ? 'bg-primary' : 'bg-transparent'}`} />
                        <span className="text-sm font-mono text-slate-300">{getValue()}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'direction',
            header: 'Richt.',
            size: 70,
            enableColumnFilter: true,
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue) return true;
                const d = String(row.getValue(columnId));
                const badge = d === '1' ? 'Hin' : d === '2' ? 'Rück' : `R${d}`;
                return badge.toLowerCase().includes(filterValue.toLowerCase());
            },
            cell: ({ getValue }) => {
                const badge = dirBadge(getValue());
                return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                        {badge.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'route_info',
            header: 'Route',
            enableColumnFilter: true,
            cell: ({ getValue }) => (
                <span className="text-xs text-slate-300 truncate block max-w-[200px]" title={getValue()}>
                    {getValue() || '—'}
                </span>
            ),
        },
        {
            accessorKey: 'volume',
            header: 'Fahrten',
            size: 70,
            enableColumnFilter: false,
            meta: { align: 'right' },
            cell: ({ getValue }) => (
                <span className="text-sm font-mono font-bold text-slate-300">{getValue()}</span>
            ),
        },
        {
            accessorKey: 'stop_count',
            header: 'Halte',
            size: 70,
            enableColumnFilter: false,
            meta: { align: 'right' },
            cell: ({ getValue }) => (
                <span className="text-xs font-mono text-slate-400">{getValue()}</span>
            ),
        },
    ], [selectedVariant]);

    const linesTable = useReactTable({
        data: lines,
        columns: linesColumns,
        state: { sorting: linesSorting },
        onSortingChange: setLinesSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableMultiSort: true,
    });

    const variantsTable = useReactTable({
        data: variants,
        columns: variantsColumns,
        state: { sorting: variantsSorting },
        onSortingChange: setVariantsSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableMultiSort: true,
    });

    const activeTable = level === 'lines' ? linesTable : variantsTable;
    const rowCount = activeTable.getFilteredRowModel().rows.length;

    return (
        <div className="h-full flex flex-col">
            {/* Header: back button when in variants view */}
            {level === 'variants' && selectedLine && (
                <div className="px-4 py-3 border-b border-border-dark flex items-center gap-3 bg-slate-800/50 shrink-0">
                    <button
                        onClick={handleBackToLines}
                        className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-sm font-bold shrink-0">
                            {selectedLine.line_no}
                        </span>
                        <span className="text-sm text-slate-200 font-medium truncate">
                            {selectedLine.name || 'Linie'}
                        </span>
                        <span className="text-sm text-text-muted">
                            · {selectedLine.variants || variants.length} Varianten
                        </span>
                    </div>
                </div>
            )}

            {/* Fahrtart Filter */}
            <div className="px-4 py-3 border-b border-border-dark bg-slate-800/20 shrink-0">
                <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500 ml-1">Fahrtart</label>
                    <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-700">
                        {[
                            { id: null, label: 'Alle' },
                            { id: 1, label: 'Linien' },
                            { id: 2, label: 'Leer' },
                            { id: 3, label: 'Position.' },
                        ].map((item) => (
                            <button
                                key={String(item.id)}
                                onClick={() => setSelectedFahrtart(item.id)}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${selectedFahrtart === item.id
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {(level === 'lines' && loading) || (level === 'variants' && variantsLoading) ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                        <p className="mt-2 text-sm">{level === 'lines' ? 'Lade Linien...' : 'Lade Varianten...'}</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse border-b border-border-dark">
                        <thead className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                            {activeTable.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    <tr>
                                        {headerGroup.headers.map((header) => {
                                            const align = header.column.columnDef.meta?.align || 'left';
                                            return (
                                                <th
                                                    key={header.id}
                                                    className={`px-4 py-3 text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 ${align === 'right' ? 'text-right' : ''}`}
                                                    style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                                                >
                                                    <SortableHeader header={header} align={align}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </SortableHeader>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    {headerGroup.headers.some((h) => h.column.getCanFilter()) && (
                                        <tr className="bg-slate-800/30">
                                            {headerGroup.headers.map((header) => (
                                                <th key={`filter-${header.id}`} className="px-4 py-1.5 border-b border-slate-700/50">
                                                    {header.column.getCanFilter() ? (
                                                        <ColumnFilter column={header.column} />
                                                    ) : null}
                                                </th>
                                            ))}
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {activeTable.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTable.getAllColumns().length} className="px-4 py-8 text-center text-text-muted text-sm">
                                        {level === 'lines' ? 'Keine Linien gefunden' : 'Keine Varianten gefunden'}
                                    </td>
                                </tr>
                            ) : (
                                activeTable.getRowModel().rows.map((row) => {
                                    const isVariantSelected = level === 'variants' && selectedVariant?.id === row.original.id;
                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() =>
                                                level === 'lines'
                                                    ? handleLineClick(row.original)
                                                    : handleVariantClick(row.original)
                                            }
                                            className={`transition-colors cursor-pointer group ${isVariantSelected
                                                ? 'bg-primary/10 hover:bg-primary/20'
                                                : 'hover:bg-slate-800/50'
                                                }`}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const align = cell.column.columnDef.meta?.align || 'left';
                                                return (
                                                    <td key={cell.id} className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''}`}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border-dark flex items-center justify-between bg-slate-800/30 shrink-0">
                <p className="text-sm text-text-muted font-medium">
                    {level === 'lines' ? `${rowCount} Linien` : `${rowCount} Varianten`}
                </p>
                {activeTable.getState().sorting.length > 0 && (
                    <button
                        onClick={() => level === 'lines' ? setLinesSorting([]) : setVariantsSorting([])}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Sortierung zurücksetzen
                    </button>
                )}
            </div>
        </div>
    );
}
