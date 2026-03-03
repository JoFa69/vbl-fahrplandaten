import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
    '/': { breadcrumb: null, title: 'Übersicht' },
    '/daten': { breadcrumb: null, title: 'Daten-Manager' },
    '/netz': { breadcrumb: 'Netzwerk', title: 'Netz' },
    '/netz/auslastung': { breadcrumb: 'Netzwerk', title: 'Auslastung' },
    '/fahrplan': { breadcrumb: null, title: 'Fahrplan & Frequenz' },
    '/haltestellen': { breadcrumb: 'Infrastruktur', title: 'Haltestellen' },
    '/haltestellen/charts': { breadcrumb: 'Details', title: 'Haltestellen Analyse' },
    '/vergleich': { breadcrumb: null, title: 'Fahrplan-Vergleich' },
    '/umlaeufe': { breadcrumb: null, title: 'Umläufe' },
    '/umlaeufe/charts': { breadcrumb: 'Details', title: 'Umlauf Analysen & Effizienz' },
    '/einstellungen': { breadcrumb: null, title: 'Einstellungen' },
};

export default function HeaderBar({ actions }) {
    const location = useLocation();
    const pageInfo = pageTitles[location.pathname] || { breadcrumb: null, title: 'Seite' };

    // Scenario State
    const [scenario, setScenario] = useState('strategic');

    useEffect(() => {
        const saved = localStorage.getItem('vbl_scenario');
        if (saved) setScenario(saved);
        else localStorage.setItem('vbl_scenario', 'strategic');
    }, []);

    const toggleScenario = (newScenario) => {
        if (newScenario === scenario) return;
        localStorage.setItem('vbl_scenario', newScenario);
        setScenario(newScenario);
        // Force reload to completely remount the app with the new database context
        window.location.reload();
    };

    return (
        <header className="h-16 border-b border-border-dark bg-[#111318]/95 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {pageInfo.breadcrumb && (
                        <>
                            <span className="text-text-muted text-sm">{pageInfo.breadcrumb}</span>
                            <span className="text-slate-600 text-sm">/</span>
                        </>
                    )}
                    <h2 className="text-slate-100 text-sm font-semibold">{pageInfo.title}</h2>
                </div>

                {scenario === 'strategic' && (
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        Strategische Planung
                    </span>
                )}
            </div>

            <div className="flex items-center gap-6">

                {/* Scenario Switcher */}
                <div className="flex bg-slate-900 border border-slate-700/50 rounded-lg p-1">
                    <button
                        onClick={() => toggleScenario('operative')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${scenario === 'operative'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Operativer Ist-Plan
                    </button>
                    <button
                        onClick={() => toggleScenario('strategic')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${scenario === 'strategic'
                                ? 'bg-amber-500 text-black shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Strategie 2027
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {actions}
                </div>
            </div>
        </header >
    );
}
