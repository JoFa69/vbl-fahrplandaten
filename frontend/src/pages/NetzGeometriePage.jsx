import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { fetchGeometryMetrics, fetchRouteGeometry, fetchPrimaryRoutes, fetchLineVariants } from '../api';
import GeometryMap from '../components/GeometryMap';

// ─── Constants for Matrix Colors (Sync with Map) ────────────────────────
const VARIANT_COLORS = [
    '#3b82f6', // blue-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#84cc16', // lime-500
];

// ─── Column Filter Component ────────────────────────────────────────────
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

// ─── Sort Indicator Component ───────────────────────────────────────────
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

// ─── Sortable Header ────────────────────────────────────────────────────
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

export default function NetzGeometriePage() {
    // Data state
    const [lines, setLines] = useState([]);
    const [variants, setVariants] = useState([]);
    const [primaryRoutes, setPrimaryRoutes] = useState([]);
    const [routeData, setRouteData] = useState(null);
    const [matrixData, setMatrixData] = useState(null);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixDirection, setMatrixDirection] = useState(1);

    // Selection state
    const [selectedLine, setSelectedLine] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedFahrtart, setSelectedFahrtart] = useState(null);
    const [level, setLevel] = useState('lines');

    // TanStack sorting state
    const [linesSorting, setLinesSorting] = useState([]);
    const [variantsSorting, setVariantsSorting] = useState([]);

    // ─── Data Fetching ──────────────────────────────────────────────────
    const loadMainData = useCallback(async () => {
        setLoading(true);
        try {
            const [linesData, routesData] = await Promise.all([
                fetchGeometryMetrics('lines', null, null, null, selectedFahrtart),
                fetchPrimaryRoutes(selectedFahrtart),
            ]);
            setLines(linesData || []);
            setPrimaryRoutes(routesData || []);
        } catch (e) {
            console.error('Failed to load geometry data', e);
        } finally {
            setLoading(false);
        }
    }, [selectedFahrtart]);

    useEffect(() => {
        loadMainData();
    }, [loadMainData]);

    // ─── Refetch variants if filter changes while in variants view ──────
    useEffect(() => {
        if (level === 'variants' && selectedLine) {
            const refetchVariants = async () => {
                setVariantsLoading(true);
                try {
                    const variantsData = await fetchGeometryMetrics('variants', null, null, selectedLine.line_no, selectedFahrtart);
                    setVariants(variantsData || []);
                } catch (e) {
                    console.error('Failed to reload variants', e);
                } finally {
                    setVariantsLoading(false);
                }
            };
            refetchVariants();
        }
    }, [selectedFahrtart, level, selectedLine]);

    // ─── Line Click → drill down to variants ────────────────────────────
    const handleLineClick = useCallback(async (line) => {
        setSelectedLine(line);
        setSelectedVariant(null);
        setLevel('variants');
        setVariantsLoading(true);

        try {
            const variantsData = await fetchGeometryMetrics('variants', null, null, line.line_no, selectedFahrtart);
            setVariants(variantsData || []);
        } catch (e) {
            console.error('Failed to load variants', e);
        } finally {
            setVariantsLoading(false);
        }

        // Load map data for this line
        setMapLoading(true);
        try {
            const data = await fetchRouteGeometry(line.line_no);
            setRouteData(data);
        } catch (e) {
            console.error('Failed to load route geometry', e);
        } finally {
            setMapLoading(false);
        }

        // Load Matrix Data
        setMatrixLoading(true);
        try {
            const matrixRes = await fetchLineVariants(line.line_no, matrixDirection);
            setMatrixData(matrixRes);
        } catch (e) {
            console.error('Failed to load matrix data', e);
        } finally {
            setMatrixLoading(false);
        }
    }, [selectedFahrtart, matrixDirection]);

    // ─── Direction effect for matrix ────────────────────────────────────
    useEffect(() => {
        if (selectedLine) {
            const loadMatrix = async () => {
                setMatrixLoading(true);
                try {
                    const matrixRes = await fetchLineVariants(selectedLine.line_no, matrixDirection);
                    setMatrixData(matrixRes);
                } catch (e) {
                    console.error('Failed to load matrix data', e);
                } finally {
                    setMatrixLoading(false);
                }
            };
            loadMatrix();
        }
    }, [matrixDirection]);

    // ─── Variant Click → show on map ────────────────────────────────────
    const handleVariantClick = useCallback(async (variant) => {
        if (selectedVariant?.id === variant.id) {
            setSelectedVariant(null);
            if (selectedLine) {
                setMapLoading(true);
                try {
                    const data = await fetchRouteGeometry(selectedLine.line_no);
                    setRouteData(data);
                } catch (e) {
                    console.error(e);
                } finally {
                    setMapLoading(false);
                }
            }
            return;
        }
        setSelectedVariant(variant);
        setMapLoading(true);
        try {
            const data = await fetchRouteGeometry(selectedLine.line_no, variant.id);
            setRouteData(data);
        } catch (e) {
            console.error('Failed to load variant geometry', e);
        } finally {
            setMapLoading(false);
        }
    }, [selectedLine, selectedVariant]);

    // ─── Back to lines ──────────────────────────────────────────────────
    const handleBackToLines = () => {
        setLevel('lines');
        setSelectedLine(null);
        setSelectedVariant(null);
        setVariants([]);
        setRouteData(null);
        setMatrixData(null);
    };

    // ─── Direction badge helper ─────────────────────────────────────────
    const dirBadge = (dir) => {
        const d = String(dir);
        if (d === '1') return { label: 'Hin', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
        if (d === '2') return { label: 'Rück', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
        return { label: `R${d}`, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    };

    // ═══════════════════════════════════════════════════════════
    // TanStack Table: Lines columns
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // TanStack Table: Variants columns
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // Table instances
    // ═══════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════
    // Resizable Layout State (pure CSS + drag)
    // ═══════════════════════════════════════════════════════════
    const [sidebarWidth, setSidebarWidth] = useState(25); // percentage
    const [mapHeight, setMapHeight] = useState(60); // percentage
    const containerRef = useRef(null);
    const isDraggingH = useRef(false);
    const isDraggingV = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingH.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                setSidebarWidth(Math.min(50, Math.max(15, pct)));
            }
            if (isDraggingV.current) {
                const rightPanel = document.getElementById('netz-right-panel');
                if (rightPanel) {
                    const rect = rightPanel.getBoundingClientRect();
                    const pct = ((e.clientY - rect.top) / rect.height) * 100;
                    setMapHeight(Math.min(85, Math.max(15, pct)));
                }
            }
        };
        const handleMouseUp = () => {
            isDraggingH.current = false;
            isDraggingV.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // ═══════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════
    return (
        <div ref={containerRef} className="h-full w-full flex min-h-0 min-w-0 relative" style={{ overflow: 'hidden' }}>
            {/* ─── Left Panel: Data Table ─── */}
            <div
                className="h-full flex flex-col border-r border-border-dark bg-surface-dark bg-slate-900 shrink-0"
                style={{ width: `${sidebarWidth}%`, minWidth: 250 }}
            >
                {/* Header: Level indicator + back button */}
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
                                { id: 3, label: 'Position.' }
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

            {/* ─── Horizontal Resize Handle ─── */}
            <div
                className="h-full w-[6px] bg-slate-800 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize flex flex-col items-center justify-center shrink-0 z-50"
                onMouseDown={(e) => {
                    e.preventDefault();
                    isDraggingH.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                }}
            >
                <div className="h-10 w-1 bg-slate-500 rounded-full" />
            </div>

            {/* ─── Right Panel: Map & Matrix ─── */}
            <div id="netz-right-panel" className="flex-1 h-full flex flex-col min-w-0 min-h-0 relative">
                {selectedLine && matrixData ? (
                    <>
                        {/* Map Section */}
                        <div className="relative w-full shrink-0" style={{ height: `${mapHeight}%` }}>
                            <div className="absolute inset-0 flex flex-col">
                                {selectedLine && routeData ? (
                                    <GeometryMap
                                        routeData={routeData}
                                        selectedLine={selectedLine.line_no}
                                        selectedVariant={selectedVariant}
                                        primaryRoutes={primaryRoutes}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-1">
                                        {primaryRoutes.length > 0 ? (
                                            <GeometryMap
                                                routeData={null}
                                                selectedLine={null}
                                                primaryRoutes={primaryRoutes}
                                                onLineSelect={(lineStub) => {
                                                    const fullLine = lines.find(l => l.line_no === String(lineStub.label));
                                                    if (fullLine) handleLineClick(fullLine);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full map-bg flex items-center justify-center">
                                                <div className="text-center text-text-muted">
                                                    <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">map</span>
                                                    <h3 className="text-lg font-semibold text-slate-300 mb-1">Kartenansicht</h3>
                                                    <p className="text-sm">Wähle eine Linie, um die Route auf der Karte anzuzeigen</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Map loading overlay */}
                                {mapLoading && (
                                    <div className="absolute inset-0 bg-bg-dark/70 flex items-center justify-center z-20">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                            <span className="text-sm text-slate-300">Lade Route...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Floating Route Info Card */}
                                {selectedLine && (
                                    <div className="absolute top-4 right-4 glass-panel rounded-xl p-4 z-10 max-w-xs pointer-events-none">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-base font-bold shadow-sm">
                                                    {selectedLine.line_no}
                                                </span>
                                                <div>
                                                    <h4 className="text-base font-semibold text-white">
                                                        {selectedLine.name || 'Route'}
                                                    </h4>
                                                    <p className="text-sm text-text-muted">
                                                        {selectedVariant
                                                            ? `Variante ${selectedVariant.variant_no} · ${selectedVariant.stop_count} Halte`
                                                            : `${selectedLine.variants} Varianten`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedVariant && (
                                            <div className="flex flex-col gap-3 mt-1">
                                                <p className="text-sm text-slate-400 truncate w-full" title={selectedVariant.route_info}>
                                                    {selectedVariant.route_info}
                                                </p>
                                                <button
                                                    onClick={() => handleVariantClick(selectedVariant)}
                                                    className="px-3 py-1.5 w-full text-[13px] font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white shadow shadow-slate-900 border border-slate-600 flex items-center justify-center gap-1.5 shrink-0 pointer-events-auto"
                                                    title="Alle Varianten auf der Karte anzeigen"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">view_list</span>
                                                    Alle Varianten anzeigen
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vertical Resize Handle */}
                        <div
                            className="w-full h-[6px] bg-slate-800 hover:bg-primary/50 active:bg-primary transition-colors cursor-row-resize flex items-center justify-center shrink-0 z-50 border-t border-slate-700"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                isDraggingV.current = true;
                                document.body.style.cursor = 'row-resize';
                                document.body.style.userSelect = 'none';
                            }}
                        >
                            <div className="w-10 h-1 bg-slate-500 rounded-full" />
                        </div>

                        {/* Matrix Section */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <div className="w-full h-full flex flex-col bg-surface-dark relative z-10 min-h-0">
                                <div className="px-5 py-3 border-b border-border-dark bg-slate-800 flex justify-between items-center shrink-0">
                                    <h4 className="text-base font-semibold text-white">Linien-Verlauf (Perlschnur)</h4>
                                    <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5">
                                        <button onClick={() => setMatrixDirection(1)} className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${matrixDirection === 1 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hinfahrt</button>
                                        <button onClick={() => setMatrixDirection(2)} className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${matrixDirection === 2 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Rückfahrt</button>
                                    </div>
                                </div>
                                {matrixLoading ? (
                                    <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>
                                ) : matrixData && matrixData.matrix.length > 0 ? (
                                    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0c10] custom-scrollbar p-0 relative">
                                        <table className="w-full text-left border-collapse" style={{ minWidth: `${matrixData.columns.length * 36 + 80}px` }}>
                                            <thead>
                                                <tr>
                                                    <th className="sticky top-0 left-0 bg-[#0a0c10] z-30 px-3 py-2 text-sm font-semibold text-slate-400 border-b border-r border-slate-800 w-[80px] min-w-[80px] max-w-[80px] shadow-sm">
                                                        Variante
                                                    </th>
                                                    {matrixData.columns.map((col, cIdx) => (
                                                        <th key={col.id} className="sticky top-0 px-0 py-0 border-b border-slate-800 bg-[#0a0c10] w-[36px] h-[100px] align-bottom shadow-sm" style={{ zIndex: 1000 - cIdx }}>
                                                            <div className="relative w-full h-full flex items-end justify-center pb-2">
                                                                <span className="absolute whitespace-nowrap text-[13px] font-medium tracking-wide text-slate-300 hover:text-white hover:z-40 cursor-default transition-colors overflow-hidden text-ellipsis"
                                                                    style={{ left: '50%', bottom: 8, transformOrigin: '0% 100%', transform: 'rotate(-50deg)', maxWidth: '140px' }}
                                                                    title={col.name}>
                                                                    {col.name}
                                                                </span>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {matrixData.matrix.map((row, idx) => {
                                                    const color = VARIANT_COLORS[parseInt(row.id) % VARIANT_COLORS.length];
                                                    const isSelected = selectedVariant?.id === row.id;

                                                    return (
                                                        <tr
                                                            key={row.id}
                                                            className={`transition-colors cursor-pointer ${isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-900/80'}`}
                                                            onClick={() => handleVariantClick({ id: row.id, variant_no: row.id, stop_count: row.stops.length, route_info: 'Ausgewählt' })}
                                                        >
                                                            <td className={`sticky left-0 ${isSelected ? 'bg-slate-800' : 'bg-[#0a0c10]'} z-20 px-3 py-2 border-b border-r border-slate-800 transition-colors w-[80px] min-w-[80px] max-w-[80px]`}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                                                    <div className="flex flex-col gap-1 items-start">
                                                                        <span className="text-xs font-bold text-slate-200 whitespace-nowrap leading-tight">Var {row.id}</span>
                                                                        <span className="text-[11px] font-medium text-white leading-none bg-slate-700/80 px-1.5 py-0.5 rounded">{row.frequency} F.</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            {matrixData.columns.map(col => {
                                                                const hasStop = row.stops.includes(col.id);
                                                                const isFirst = row.stops[0] === col.id;
                                                                const isLast = row.stops[row.stops.length - 1] === col.id;

                                                                return (
                                                                    <td key={col.id} className="px-0 py-2 border-b border-slate-800 text-center relative group">
                                                                        {hasStop && (
                                                                            <div className="absolute inset-0 flex items-center">
                                                                                <div
                                                                                    className="h-[3px] w-full"
                                                                                    style={{
                                                                                        backgroundColor: color,
                                                                                        opacity: 0.8,
                                                                                        marginLeft: isFirst ? '50%' : '0',
                                                                                        width: isFirst || isLast ? '50%' : '100%',
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        )}
                                                                        {hasStop && (
                                                                            <div
                                                                                className="relative z-10 mx-auto w-3.5 h-3.5 rounded-full border-2 border-[#0a0c10] shadow-sm transform group-hover:scale-125 transition-transform"
                                                                                style={{ backgroundColor: color }}
                                                                            ></div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                        Keine Varianten-Daten gefunden.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 flex flex-col">
                            {primaryRoutes.length > 0 ? (
                                <GeometryMap
                                    routeData={null}
                                    selectedLine={null}
                                    primaryRoutes={primaryRoutes}
                                    onLineSelect={(lineStub) => {
                                        const fullLine = lines.find(l => l.line_no === String(lineStub.label));
                                        if (fullLine) handleLineClick(fullLine);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full map-bg flex items-center justify-center">
                                    <div className="text-center text-text-muted">
                                        <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">map</span>
                                        <h3 className="text-lg font-semibold text-slate-300 mb-1">Kartenansicht</h3>
                                        <p className="text-sm">Wähle eine Linie, um die Route auf der Karte anzuzeigen</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

