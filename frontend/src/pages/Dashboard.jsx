import { useEffect, useState } from "react";
import { fetchStats } from "../api";
import { Database, Table, AlertCircle } from "lucide-react";

export default function Dashboard() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats()
            .then(setStats)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-slate-400">Lade Statistiken...</div>;
    if (error) return (
        <div className="text-red-400 flex flex-col items-center gap-4 mt-10">
            <div className="flex items-center gap-2">
                <AlertCircle /> {error}
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
                Verbindung wiederholen
            </button>
        </div>
    );

    const totalRows = stats.reduce((acc, curr) => acc + curr.rows, 0);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Übersicht</h2>
                <p className="text-slate-400">Übersicht der importierten VDV 452 Fahrplandaten.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Table size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.length}</div>
                    <div className="text-sm text-slate-400">Tabellen in DB</div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                            <Database size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalRows.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Datensätze gesamt</div>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                    <h3 className="font-semibold text-lg text-white">Datenbank-Tabellen</h3>
                </div>
                <div className="divide-y divide-slate-700">
                    {stats.sort((a, b) => b.rows - a.rows).map((stat) => (
                        <div key={stat.table} className="px-6 py-3 flex justify-between items-center hover:bg-slate-750">
                            <span className="font-mono text-slate-300">{stat.table}</span>
                            <span className="text-sm text-slate-400 font-mono">{stat.rows.toLocaleString()} Zeilen</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
