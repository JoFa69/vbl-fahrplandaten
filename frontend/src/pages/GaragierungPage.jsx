import React, { useState, useEffect } from 'react';
import { formatTime } from '../utils/formatters';
import { fetchGaragingData } from '../api';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Collapsible from '../components/ui/Collapsible';
import Spinner from '../components/ui/Spinner';

const columnHelper = createColumnHelper();

export default function GaragierungPage() {
    const [details, setDetails] = useState([]);
    const [peakVehicles, setPeakVehicles] = useState([]);
    const [vehiclesPerDepot, setVehiclesPerDepot] = useState([]);
    const [peakPerLine, setPeakPerLine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tagesart, setTagesart] = useState('Mo-Do');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const res = await fetchGaragingData(tagesart);
                setDetails(res.details || []);
                setPeakVehicles(res.peak_vehicles || []);
                setVehiclesPerDepot(res.vehicles_per_depot || []);
                setPeakPerLine(res.peak_per_line || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [tagesart]);

    const ausfahrtenColumns = React.useMemo(() => [
        columnHelper.accessor('ausfahrt_zeit', {
            header: 'Zeit',
            cell: info => <span className="text-white font-mono">{formatTime(info.getValue())}</span>,
            enableColumnFilter: false,
        }),
        columnHelper.accessor('umlauf_kuerzel', {
            header: 'Umlauf',
            cell: info => <span className="text-white font-medium">{info.getValue()}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('line_no', {
            header: 'Linie',
            cell: info => <StatusBadge color="blue">Linie {info.getValue()}</StatusBadge>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('depot_ausfahrt', {
            header: 'Depot',
            cell: info => <span className="text-text-muted text-sm">{info.getValue() || '-'}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('is_asymmetric', {
            header: 'Asymmetrie',
            cell: info => info.getValue() ? (
                <StatusBadge color="amber" title={`Endet an anderem Depot: ${info.row.original.depot_einfahrt}`}>
                    Asymmetrisch
                </StatusBadge>
            ) : null,
            enableColumnFilter: false,
        }),
        columnHelper.accessor('vehicle_type', {
            header: 'Fahrzeugtyp',
            cell: info => <StatusBadge color="gray">{info.getValue()}</StatusBadge>,
            enableColumnFilter: true,
        }),
    ], []);

    const einfahrtenColumns = React.useMemo(() => [
        columnHelper.accessor('einfahrt_zeit', {
            header: 'Zeit',
            cell: info => <span className="text-white font-mono">{formatTime(info.getValue())}</span>,
            enableColumnFilter: false,
        }),
        columnHelper.accessor('umlauf_kuerzel', {
            header: 'Umlauf',
            cell: info => <span className="text-white font-medium">{info.getValue()}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('line_no', {
            header: 'Linie',
            cell: info => <StatusBadge color="blue">Linie {info.getValue()}</StatusBadge>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('depot_einfahrt', {
            header: 'Depot',
            cell: info => <span className="text-text-muted text-sm">{info.getValue() || '-'}</span>,
            enableColumnFilter: true,
        }),
        columnHelper.accessor('is_asymmetric', {
            header: 'Asymmetrie',
            cell: info => info.getValue() ? (
                <StatusBadge color="amber" title={`Startete an anderem Depot: ${info.row.original.depot_ausfahrt}`}>
                    Asymmetrisch
                </StatusBadge>
            ) : null,
            enableColumnFilter: false,
        }),
        columnHelper.accessor('vehicle_type', {
            header: 'Fahrzeugtyp',
            cell: info => <StatusBadge color="gray">{info.getValue()}</StatusBadge>,
            enableColumnFilter: true,
        }),
    ], []);

    if (loading) return <Spinner label="Lade Garagierungsdaten..." />;

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                    Fehler: {error}
                </div>
            </div>
        );
    }

    // Group vehicles_per_depot by depot
    const groupedVehiclesPerDepot = {};
    vehiclesPerDepot.forEach(item => {
        if (!groupedVehiclesPerDepot[item.depot]) {
            groupedVehiclesPerDepot[item.depot] = { depot: item.depot, ausfahrten_total: 0, einfahrten_total: 0, vehicle_types: [] };
        }
        groupedVehiclesPerDepot[item.depot].ausfahrten_total += item.ausfahrten_count;
        groupedVehiclesPerDepot[item.depot].einfahrten_total += item.einfahrten_count;
        groupedVehiclesPerDepot[item.depot].vehicle_types.push({ type: item.vehicle_type, ausfahrten: item.ausfahrten_count, einfahrten: item.einfahrten_count });
    });
    const sortedDepots = Object.values(groupedVehiclesPerDepot).sort((a, b) => b.ausfahrten_total - a.ausfahrten_total);

    // Group peakPerLine by line number
    const groupedPeakPerLine = {};
    peakPerLine.forEach(item => {
        if (!groupedPeakPerLine[item.line_no]) groupedPeakPerLine[item.line_no] = { line_no: item.line_no, vehicles: [] };
        groupedPeakPerLine[item.line_no].vehicles.push({ type: item.vehicle_type, peak: item.max_vehicles_needed });
    });
    const sortedGroupedLines = Object.values(groupedPeakPerLine).sort((a, b) => {
        const aNum = parseInt(a.line_no.replace(/^\D+/g, '')) || 999;
        const bNum = parseInt(b.line_no.replace(/^\D+/g, '')) || 999;
        return aNum - bNum;
    });

    // Summary aggregations
    const summaryAusfahrten = {};
    const summaryEinfahrten = {};
    vehiclesPerDepot.forEach(item => {
        summaryAusfahrten[item.depot] = (summaryAusfahrten[item.depot] || 0) + item.ausfahrten_count;
        summaryEinfahrten[item.depot] = (summaryEinfahrten[item.depot] || 0) + item.einfahrten_count;
    });

    const ausfahrtenList = details.filter(r => r.ausfahrt_zeit != null);
    const einfahrtenList = details.filter(r => r.einfahrt_zeit != null);

    return (
        <div className="p-8 pb-32 max-w-[1600px] mx-auto space-y-8 animate-in mt-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Garagen & Depots</h1>
                    <p className="text-text-muted">Übersicht über Fahrzeugausfahrten und -einfahrten pro Depot.</p>
                </div>
                <div className="flex bg-bg-card border border-border-dark p-1 rounded-lg gap-1">
                    {['Mo-Do', 'Fr', 'Sa', 'So/Ft'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTagesart(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tagesart === tab ? 'bg-primary text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-card border border-border-dark rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4">Ausfahrten pro Depot</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(summaryAusfahrten).sort((a, b) => b[1] - a[1]).map(([depot, count]) => (
                            <div key={depot} className="flex flex-col bg-bg-dark p-4 rounded-lg border border-border-dark/50 min-w-[140px] flex-1">
                                <span className="text-text-muted text-xs uppercase tracking-wider mb-1">{depot}</span>
                                <span className="text-emerald-400 text-3xl font-bold">{Math.round(count)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-bg-card border border-border-dark rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4">Einfahrten pro Depot</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(summaryEinfahrten).sort((a, b) => b[1] - a[1]).map(([depot, count]) => (
                            <div key={depot} className="flex flex-col bg-bg-dark p-4 rounded-lg border border-border-dark/50 min-w-[140px] flex-1">
                                <span className="text-text-muted text-xs uppercase tracking-wider mb-1">{depot}</span>
                                <span className="text-rose-400 text-3xl font-bold">{Math.round(count)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Depot Details */}
                <div className="bg-bg-card border border-border-dark rounded-xl p-6 flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
                    <h3 className="text-white font-bold">Fahrzeuge pro Depot (Details)</h3>
                    <p className="text-text-muted text-xs mt-1 mb-4">Aufgeschlüsselt nach Typ</p>
                    <div className="flex flex-col gap-4 flex-grow overflow-auto custom-scrollbar pr-2">
                        {sortedDepots.map((depot) => (
                            <div key={depot.depot} className="bg-bg-dark rounded-lg border border-border-dark/50 p-4">
                                <p className="text-white font-bold mb-3 text-lg">{depot.depot}</p>
                                <div className="space-y-4">
                                    {depot.vehicle_types.sort((a, b) => b.ausfahrten - a.ausfahrten).map(vt => (
                                        <div key={vt.type} className="flex justify-between items-center bg-black/20 p-3 rounded border border-white/5">
                                            <span className="text-white text-base font-medium flex-1">{vt.type}</span>
                                            <div className="flex gap-8 font-mono">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-emerald-500/70 uppercase font-black">Aus</span>
                                                    <span className="text-emerald-400 text-2xl font-black">{vt.ausfahrten.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-rose-500/70 uppercase font-black">Ein</span>
                                                    <span className="text-rose-400 text-2xl font-black">{vt.einfahrten.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3 border-t border-border-dark/60 mt-2">
                                        <span className="text-white font-bold text-base">Gesamt:</span>
                                        <div className="flex gap-6 font-mono">
                                            <span className="text-emerald-400 text-2xl font-black">{depot.ausfahrten_total.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                            <span className="text-rose-400 text-2xl font-black">{depot.einfahrten_total.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak Vehicles by Type */}
                <div className="bg-bg-card border border-border-dark rounded-xl p-6 flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
                    <h3 className="text-white font-bold">Max. benötigte Fahrzeuge</h3>
                    <p className="text-text-muted text-xs mt-1 mb-4">Gleichzeitig auf der Strecke (nach Typ)</p>
                    <div className="flex flex-col gap-3 flex-grow overflow-auto custom-scrollbar pr-2">
                        {peakVehicles.map((item) => (
                            <div key={item.vehicle_type} className="flex justify-between items-center bg-bg-dark p-3 rounded-lg border border-border-dark/50 hover:border-orange-500/30 transition-colors">
                                <span className="text-white font-medium">{item.vehicle_type}</span>
                                <span className="px-4 py-2 rounded-md bg-orange-500/10 text-orange-400 font-black text-2xl border border-orange-500/20">
                                    {Math.round(item.max_vehicles_needed)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peak Per Line */}
                <div className="bg-bg-card border border-border-dark rounded-xl p-6 flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
                    <h3 className="text-white font-bold">Bedarf pro Linie</h3>
                    <p className="text-text-muted text-xs mt-1 mb-4">Gleichzeitig auf der Strecke (gruppiert)</p>
                    <div className="flex flex-col gap-4 flex-grow overflow-auto custom-scrollbar pr-2">
                        {sortedGroupedLines.map((line) => (
                            <div key={line.line_no} className="bg-bg-dark p-4 rounded-lg border border-border-dark/30 hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-2 mb-3">
                                    <StatusBadge color="blue">Linie {line.line_no}</StatusBadge>
                                </div>
                                <div className="space-y-2">
                                    {line.vehicles.map(v => (
                                        <div key={v.type} className="flex justify-between items-center text-sm pl-2 border-l-2 border-primary/30">
                                            <span className="text-text-muted truncate mr-2" title={v.type}>{v.type}</span>
                                            <span className="text-blue-400 font-bold whitespace-nowrap">{Math.round(v.peak)} Fzg.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Collapsible Detail Tables */}
            <div className="space-y-4">
                <Collapsible title="Detaillierte Ausfahrten Tabelle">
                    <div className="p-4 h-[500px]">
                        <DataTable
                            data={ausfahrtenList}
                            columns={ausfahrtenColumns}
                            filterPlaceholder="Ausfahrten filtern..."
                            initialSort={[{ id: 'ausfahrt_zeit', desc: false }]}
                        />
                    </div>
                </Collapsible>
                <Collapsible title="Detaillierte Einfahrten Tabelle">
                    <div className="p-4 h-[500px]">
                        <DataTable
                            data={einfahrtenList}
                            columns={einfahrtenColumns}
                            filterPlaceholder="Einfahrten filtern..."
                            initialSort={[{ id: 'einfahrt_zeit', desc: false }]}
                        />
                    </div>
                </Collapsible>
            </div>
        </div>
    );
}
