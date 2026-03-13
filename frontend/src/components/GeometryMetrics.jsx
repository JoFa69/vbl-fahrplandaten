import React, { useEffect, useState, useMemo } from 'react';
import { fetchGeometryMetrics } from '../api';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from './DataTable';

const columnHelper = createColumnHelper();

export default function GeometryMetrics({
    selectedLine,
    selectedVariant,
    onLineSelect,
    onVariantSelect
}) {
    const [level, setLevel] = useState("variants"); // variants -> stops
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sync internal level with props
    useEffect(() => {
        if (selectedVariant) {
            setLevel("stops");
        } else {
            setLevel("variants");
        }
    }, [selectedVariant]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                let res = [];
                if (level === "variants") {
                    res = await fetchGeometryMetrics("variants", selectedLine ? selectedLine.id : null);
                } else if (level === "stops" && selectedVariant) {
                    res = await fetchGeometryMetrics("stops", null, selectedVariant.id);
                }
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [level, selectedLine, selectedVariant]);

    const handleBack = () => {
        onVariantSelect(null);
    };

    // Columns Configuration
    const variantColumns = useMemo(() => [
        columnHelper.accessor('line_no', {
            header: 'Linie',
            cell: info => <span className="font-bold text-white">{info.getValue()}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('variant_no', {
            header: 'Var.',
            cell: info => <span className="font-mono text-xs">{info.getValue()}</span>,
        }),
        columnHelper.accessor('direction', {
            header: 'Ri.',
            cell: info => <span className="text-xs">{info.getValue()}</span>,
        }),
        columnHelper.accessor('route_info', {
            header: 'Route',
            cell: info => <span className="text-xs">{info.getValue()}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('volume', {
            header: 'Fahrten',
            cell: info => <div className="text-right font-mono text-xs">{info.getValue()}</div>,
        }),
        columnHelper.accessor('stop_count', {
            header: 'Halte',
            cell: info => <div className="text-right font-mono text-xs">{info.getValue()}</div>,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Aktion',
            cell: props => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onVariantSelect(props.row.original);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                    Details &rarr;
                </button>
            ),
        }),
    ], [onVariantSelect]);

    const stopColumns = useMemo(() => [
        columnHelper.accessor('seq', {
            header: 'Seq',
            cell: info => <span className="font-mono text-xs text-slate-400">{info.getValue()}</span>,
        }),
        columnHelper.accessor('name', {
            header: 'Haltestelle',
            cell: info => <span className="text-slate-200">{info.getValue()}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor(row => `${(row.lat || 0).toFixed(4)}, ${(row.lon || 0).toFixed(4)}`, {
            id: 'coords',
            header: 'Koord.',
            cell: info => <div className="text-right font-mono text-xs text-slate-500">{info.getValue()}</div>,
            enableColumnFilter: false,
        }),
    ], []);

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-semibold text-white">Netz-Geometrie</h3>
                {level === "stops" && (
                    <button
                        onClick={handleBack}
                        className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
                    >
                        &larr; Zurück
                    </button>
                )}
            </div>

            {loading ? <div className="text-slate-400">Lade Daten...</div> : (
                <div className="flex-1 min-h-0">
                    {level === "variants" ? (
                        <DataTable
                            data={data}
                            columns={variantColumns}
                            onRowClick={onVariantSelect}
                            filterPlaceholder="Suche in allen Spalten..."
                            initialSort={[{ id: 'line_no', desc: false }]}
                        />
                    ) : (
                        <DataTable
                            data={data}
                            columns={stopColumns}
                            filterPlaceholder="Suche Haltestelle..."
                            initialSort={[{ id: 'seq', desc: false }]}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
