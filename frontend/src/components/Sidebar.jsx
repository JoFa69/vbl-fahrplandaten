import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { to: '/', icon: 'dashboard', label: 'Übersicht' },
    { to: '/daten', icon: 'database', label: 'Daten-Manager' },
    { to: '/netz', icon: 'map', label: 'Netz-Geometrie' },
    { to: '/netz/plan', icon: 'account_tree', label: 'Netzplan (Topologie)' },
    { to: '/netz/auslastung', icon: 'layers', label: 'Netz-Auslastung' },
    { to: '/fahrplan', icon: 'calendar_month', label: 'Fahrplan & Frequenz' },
    { to: '/haltestellen', icon: 'location_on', label: 'Haltestellen' },
    { to: '/haltestellen/charts', icon: 'monitoring', label: 'Haltestellen-Charts' },
    { to: '/vergleich', icon: 'compare_arrows', label: 'Fahrplan-Vergleich' },
    { to: '/korridor', icon: 'timeline', label: 'Korridor-Analyse' },
    { to: '/umlaeufe', icon: 'loop', label: 'Umläufe' },
    { to: '/umlaeufe/charts', icon: 'insert_chart', label: 'Umlauf-Charts' },
    { to: '/garagen', icon: 'local_shipping', label: 'Garagen & Depots' },
];

export default function Sidebar() {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        // Exact match for routes that have sub-routes (e.g. /haltestellen vs /haltestellen/charts)
        if (path === '/haltestellen') return location.pathname === '/haltestellen';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-[#111318] border-r border-border-dark flex flex-col shrink-0 z-20 h-full">
            {/* Brand */}
            <div className="p-5 flex items-center gap-3 border-b border-border-dark">
                <div className="size-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-xl">analytics</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-white leading-tight">VBL Fahrplan-Analyse</h1>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-0.5">Enterprise Edition</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group ${active
                                ? 'bg-primary/15 text-white'
                                : 'text-text-muted hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                            )}
                            <span
                                className={`material-symbols-outlined text-xl transition-colors ${active ? 'text-primary' : 'group-hover:text-primary'
                                    }`}
                                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                    );
                })}

                <div className="my-2 border-t border-border-dark/50" />

                <NavLink
                    to="/einstellungen"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                            ? 'bg-primary/15 text-white'
                            : 'text-text-muted hover:text-white hover:bg-slate-800'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">
                        settings
                    </span>
                    <span className="text-sm font-medium">Einstellungen</span>
                </NavLink>
            </nav>


        </aside>
    );
}
