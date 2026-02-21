import React, { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, Search, Filter } from 'lucide-react';

export default function GeometryTable({
    data,
    columns,
    onRowClick,
    filterPlaceholder = "Suchen...",
    initialSort = []
}) {
    const [sorting, setSorting] = useState(initialSort);
    const [columnFilters, setColumnFilters] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableMultiSort: true,
    });

    return (
        <div className="flex flex-col h-full">
            {/* Global Filter */}
            <div className="flex items-center gap-2 mb-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                <Search className="text-slate-400" size={16} />
                <input
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder={filterPlaceholder}
                    className="bg-transparent border-none text-slate-200 text-sm focus:ring-0 w-full placeholder-slate-500"
                />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar border border-slate-700 rounded-lg">
                <table className="w-full text-left border-collapse relative">
                    <thead className="bg-slate-800 sticky top-0 z-10 shadow-sm">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-slate-700">
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="p-0 align-top group">
                                        <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700/50 last:border-r-0">
                                            {/* Header Content with Sort */}
                                            <div
                                                className={`
                                                    p-3 flex items-center justify-between cursor-pointer select-none transition-colors
                                                    hover:bg-slate-700/50 text-slate-300 text-xs font-semibold uppercase tracking-wider
                                                    ${header.column.getCanSort() ? 'cursor-pointer' : ''}
                                                `}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </div>

                                                {/* Sort Indicator */}
                                                <div className="flex flex-col gap-0.5 text-slate-500 w-4 items-center">
                                                    {{
                                                        asc: <ArrowUpDown size={14} className="text-blue-400" />,
                                                        desc: <ArrowUpDown size={14} className="text-blue-400 transform rotate-180" />,
                                                    }[header.column.getIsSorted()] ?? (
                                                            header.column.getCanSort() ? <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30" /> : null
                                                        )}
                                                </div>
                                            </div>

                                            {/* Column Filter Input */}
                                            {header.column.getCanFilter() ? (
                                                <div className="px-2 pb-2">
                                                    <input
                                                        type="text"
                                                        value={(header.column.getFilterValue() ?? '')}
                                                        onChange={e => header.column.setFilterValue(e.target.value)}
                                                        placeholder={`Filter...`}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 focus:border-blue-500 focus:outline-none placeholder-slate-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-6"></div> // Spacer
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 bg-slate-800/20">
                        {table.getRowModel().rows.map(row => (
                            <tr
                                key={row.id}
                                className={`
                                    transition-colors hover:bg-slate-700/40
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                `}
                                onClick={() => onRowClick && onRowClick(row.original)}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="p-3 text-sm text-slate-300 border-r border-slate-700/30 last:border-r-0">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {data.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        Keine Daten gefunden.
                    </div>
                )}
            </div>

            <div className="mt-2 text-xs text-slate-500 px-2">
                {table.getRowModel().rows.length} Einträge
            </div>
        </div>
    );
}
