import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '../api';
import KpiCard from '../components/ui/KpiCard';

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

    if (loading) return <div className="text-slate-400 p-6">Lade Statistiken...</div>;
    if (error) return (
        <div className="text-red-400 flex flex-col items-center gap-4 mt-10">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
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
        <div className="space-y-6 p-6">
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">Übersicht</h2>
                <p className="text-slate-400">Übersicht der importierten VDV 452 Fahrplandaten.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    label="Tabellen in DB"
                    value={stats.length}
                    icon="table_chart"
                    iconColor="text-blue-400"
                />
                <KpiCard
                    label="Datensätze gesamt"
                    value={totalRows.toLocaleString('de-DE')}
                    icon="storage"
                    iconColor="text-emerald-400"
                />
            </div>

            <div className="bg-slate-900 border border-border-dark rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border-dark">
                    <h3 className="font-semibold text-lg text-white">Datenbank-Tabellen</h3>
                </div>
                <div className="divide-y divide-slate-800">
                    {stats.sort((a, b) => b.rows - a.rows).map((stat) => (
                        <div key={stat.table} className="px-6 py-3 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                            <Link
                                to={`/table/${stat.table}`}
                                className="font-mono text-slate-300 hover:text-blue-400 hover:underline transition-colors"
                            >
                                {stat.table}
                            </Link>
                            <span className="text-sm text-slate-400 font-mono">{stat.rows.toLocaleString('de-DE')} Zeilen</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
