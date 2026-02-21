import React, { useState, useEffect } from 'react';
import { Download, Activity, Bus, Clock, Map } from 'lucide-react';
import VolumeMetrics from './VolumeMetrics';
import TimeMetrics from './TimeMetrics';
import InfrastructureMetrics from './InfrastructureMetrics';
import GeometryMetrics from './GeometryMetrics';
import GeometryMap from './GeometryMap';
import { fetchAnalyticsStats } from '../api';

export default function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState("volume");
    const [selectedLine, setSelectedLine] = useState(null);

    // State for Netz-Geometrie
    const [geoSelectedLine, setGeoSelectedLine] = useState(null);
    const [geoSelectedVariant, setGeoSelectedVariant] = useState(null);

    // Real Data State
    const [stats, setStats] = useState(null);

    // Fetch Stats
    React.useEffect(() => {
        async function loadStats() {
            try {
                const data = await fetchAnalyticsStats();
                setStats(data);
            } catch (e) {
                console.error("Failed to load stats", e);
            }
        }
        loadStats();
    }, []);

    // KPIs derived from real data
    const kpis = [
        {
            title: "Fahrten Gesamt",
            value: stats?.total_planned_trips?.value ?? "-",
            icon: Activity,
            change: stats?.total_planned_trips?.change || null
        },
        {
            title: "Aktive Linien",
            value: stats?.total_lines?.value ?? "-",
            icon: Bus,
            change: stats?.total_lines?.change || null
        },
        // Punctuality removed as per requirement
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'volume':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[600px]">
                        <div className="lg:col-span-3 h-full">
                            <VolumeMetrics
                                selectedLine={selectedLine}
                                onLineSelect={setSelectedLine}
                            />
                        </div>
                        <div className="lg:col-span-2 h-full">
                            <GeometryMap selectedLine={selectedLine} />
                        </div>
                    </div>
                );
            case 'time':
                return <TimeMetrics />;
            case 'infra':
                return <InfrastructureMetrics />;
            case 'geo':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[600px]">
                        <div className="lg:col-span-2 h-full">
                            <GeometryMetrics
                                selectedLine={geoSelectedLine}
                                selectedVariant={geoSelectedVariant}
                                onLineSelect={setGeoSelectedLine}
                                onVariantSelect={setGeoSelectedVariant}
                            />
                        </div>
                        <div className="lg:col-span-3 h-full">
                            <GeometryMap
                                selectedLine={geoSelectedLine}
                                selectedVariant={geoSelectedVariant}
                            />
                        </div>
                    </div>
                );
            case 'map':
                return (
                    <div className="h-[750px] w-full">
                        <GeometryMap showAllStops={true} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        VDV 452 Analytics
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Echtzeit-Analyse der Fahrplandaten</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-500/20">
                    <Download size={18} />
                    <span>Daten exportieren (CSV)</span>
                </button>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-fit mb-8 border border-slate-700/50">
                {[
                    { id: 'volume', label: 'Fahrten-Volumen' },
                    { id: 'time', label: 'Zeit-Analyse' },
                    { id: 'infra', label: 'Infrastruktur' },
                    { id: 'geo', label: 'Netz-Geometrie' },
                    { id: 'map', label: 'Karte' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {kpis.map((kpi, index) => (
                    <div key={index} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-400 text-sm font-medium">{kpi.title}</span>
                            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                                <kpi.icon size={18} />
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-2xl font-bold text-white">{kpi.value}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${kpi.change && kpi.change.startsWith('+')
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : (kpi.change && kpi.change.startsWith('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400')
                                }`}>
                                {kpi.change || "-"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <main>
                {renderContent()}
            </main>
        </div>
    );
}
