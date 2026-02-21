import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTables, fetchTableData } from "../api";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";

export default function DataExplorer() {
    const { tableName } = useParams();
    const navigate = useNavigate();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(tableName || "");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const LIMIT = 100;

    useEffect(() => {
        fetchTables().then((res) => {
            setTables(res.tables || []);
            if (res.tables && res.tables.length > 0) {
                if (!selectedTable) {
                    if (tableName && res.tables.includes(tableName)) {
                        setSelectedTable(tableName);
                    } else {
                        setSelectedTable("rec_frt" in res.tables ? "rec_frt" : res.tables[0]);
                    }
                }
            }
        });
    }, [tableName]);

    useEffect(() => {
        if (selectedTable) {
            loadData();
        }
    }, [selectedTable, page]);

    function loadData() {
        setLoading(true);
        fetchTableData(selectedTable, LIMIT, page * LIMIT)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Data Explorer</h2>
                    <p className="text-slate-400">Inspect raw VDV tables.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedTable}
                        onChange={(e) => {
                            setSelectedTable(e.target.value);
                            setPage(0);
                            navigate(`/table/${e.target.value}`);
                        }}
                    >
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </header>

            {/* Data Table */}
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                {loading && !data ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Loading data...
                    </div>
                ) : data ? (
                    <>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-900 sticky top-0 z-10 text-xs uppercase font-semibold text-slate-300">
                                    <tr>
                                        {data.columns.map(col => (
                                            <th key={col} className="px-6 py-3 border-b border-slate-700 whitespace-nowrap">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {data.data.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                                            {data.columns.map(col => (
                                                <td key={`${i}-${col}`} className="px-6 py-3 whitespace-nowrap text-slate-300">
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-slate-800 border-t border-slate-700 p-4 flex justify-between items-center">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                className="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-slate-400 text-sm">
                                Page {page + 1}
                            </span>
                            <button
                                disabled={data.data.length < LIMIT}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select a table to view data
                    </div>
                )}
            </div>
        </div>
    );
}
