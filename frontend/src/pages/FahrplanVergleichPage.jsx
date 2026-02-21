import React, { useState } from 'react';

// Fully mock-data driven since no backend comparison endpoint exists
const mockKpis = [
    { label: 'FAHRTEN GESAMT', baseline: '3.842', target: '4.196', delta: '+354', deltaPercent: '+9.2%', up: true },
    { label: 'BETRIEBSKILOMETER', baseline: '18.450', target: '19.870', delta: '+1.420', deltaPercent: '+7.7%', up: true },
    { label: 'BETRIEBSSTUNDEN', baseline: '1.250', target: '1.180', delta: '−70', deltaPercent: '−5.6%', up: false },
    { label: 'AKTIVE HALTEST.', baseline: '486', target: '498', delta: '+12', deltaPercent: '+2.5%', up: true },
];

const mockAdded = [
    { type: 'Neue Haltestelle', icon: 'add_location', desc: 'Bahnhof Süd — erschliesst neues Wohngebiet', color: 'emerald' },
    { type: 'Streckenerweiterung', icon: 'route', desc: 'Linie 7 verlängert bis Gewerbepark Ost', color: 'emerald' },
    { type: 'Takterhöhung', icon: 'speed', desc: 'Linie 1 HVZ-Takt von 10 auf 7.5 Minuten', color: 'emerald' },
    { type: 'Neue Verbindung', icon: 'sync_alt', desc: 'Direkte Anbindung Spital–Universität', color: 'emerald' },
];

const mockRemoved = [
    { type: 'Linie eingestellt', icon: 'remove_circle', desc: 'Linie 23 (Altstadt–Bergdorf) eingestellt', color: 'rose' },
    { type: 'Taktreduktion', icon: 'trending_down', desc: 'Linie 14 NVZ-Takt von 15 auf 20 Minuten', color: 'rose' },
    { type: 'Haltestelle aufgehoben', icon: 'wrong_location', desc: 'Haltepunkt "Mühlweg" entfällt — geringe Nutzung', color: 'rose' },
];

export default function FahrplanVergleichPage() {
    const [baseline, setBaseline] = useState('FP 2025');
    const [target, setTarget] = useState('FP 2026');

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">compare_arrows</span>
                        Fahrplan-Vergleich
                    </h2>
                    <p className="text-sm text-text-muted mt-0.5">Vergleich zweier Fahrplanperioden</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg border border-slate-700 px-3 py-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase">Basis</span>
                        <select
                            value={baseline}
                            onChange={(e) => setBaseline(e.target.value)}
                            className="bg-transparent text-slate-200 text-xs font-bold border-none focus:ring-0 p-0"
                        >
                            <option>FP 2025</option>
                            <option>FP 2024</option>
                        </select>
                    </div>
                    <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                    <div className="flex items-center gap-2 bg-primary/10 rounded-lg border border-primary/30 px-3 py-2">
                        <span className="text-[10px] font-bold text-primary uppercase">Ziel</span>
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="bg-transparent text-primary text-xs font-bold border-none focus:ring-0 p-0"
                        >
                            <option>FP 2026</option>
                            <option>FP 2027</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Mock data badge */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
                <span className="material-symbols-outlined text-amber-500 text-sm">info</span>
                <span className="text-xs text-amber-400 font-medium">
                    Beispieldaten — Fahrplan-Vergleich benötigt zwei importierte Datensätze für echte Analysen
                </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockKpis.map((kpi, i) => (
                    <div key={i} className="bg-slate-900 border border-border-dark p-5 rounded-xl">
                        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{kpi.label}</span>
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-white">{kpi.target}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">von {kpi.baseline}</span>
                            </div>
                            <div className={`flex flex-col items-end ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <span className="text-lg font-black">{kpi.delta}</span>
                                <span className="text-[10px] font-bold">{kpi.deltaPercent}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Added */}
                <div>
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Hinzugefügte Leistung
                    </h3>
                    <div className="space-y-3">
                        {mockAdded.map((item, i) => (
                            <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.type}</h4>
                                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Removed / Reduced */}
                <div>
                    <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">remove_circle</span>
                        Eingestellt / Reduziert
                    </h3>
                    <div className="space-y-3">
                        {mockRemoved.map((item, i) => (
                            <div key={i} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 flex items-start gap-4 hover:border-rose-500/30 transition-colors">
                                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-lg shrink-0">
                                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.type}</h4>
                                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
