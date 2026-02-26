import React from 'react';
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

    return (
        <header className="h-16 border-b border-border-dark bg-[#111318]/95 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-2">
                {pageInfo.breadcrumb && (
                    <>
                        <span className="text-text-muted text-sm">{pageInfo.breadcrumb}</span>
                        <span className="text-slate-600 text-sm">/</span>
                    </>
                )}
                <h2 className="text-slate-100 text-sm font-semibold">{pageInfo.title}</h2>
            </div>

            <div className="flex items-center gap-4">
                {actions}
            </div>
        </header >
    );
}
