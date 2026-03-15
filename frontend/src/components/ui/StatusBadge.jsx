import React from 'react';

const COLOR_MAP = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gray:   'bg-slate-700/50 text-slate-400 border-slate-600/50',
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    teal:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

/**
 * Colored pill badge.
 * color: one of the keys in COLOR_MAP above
 * title: optional tooltip text
 */
export default function StatusBadge({ color = 'gray', children, title }) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${COLOR_MAP[color] ?? COLOR_MAP.gray}`}
            title={title}
        >
            {children}
        </span>
    );
}
