import React from 'react';

/**
 * Standard KPI metric card.
 * icon: material-symbols name (e.g. 'route', 'directions_bus')
 * iconColor: Tailwind text color class (e.g. 'text-blue-400')
 */
export default function KpiCard({ label, value, icon, iconColor = 'text-primary' }) {
    return (
        <div className="bg-slate-900 border border-border-dark p-5 rounded-xl transition-all hover:border-primary/50 group">
            <div className="flex justify-between items-start mb-2">
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
                <span className={`material-symbols-outlined ${iconColor} group-hover:scale-110 transition-transform`}>
                    {icon}
                </span>
            </div>
            <span className="text-3xl font-black text-white">{value}</span>
        </div>
    );
}
