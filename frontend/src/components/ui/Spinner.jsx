import React from 'react';

const SIZE = { sm: 'text-xl', md: 'text-3xl', lg: 'text-4xl' };

/**
 * Centered loading spinner using Material Symbols.
 * size: 'sm' | 'md' | 'lg'
 * label: optional text shown below the spinner
 */
export default function Spinner({ size = 'md', label = null }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className={`material-symbols-outlined animate-spin text-primary ${SIZE[size] ?? SIZE.md}`}>
                progress_activity
            </span>
            {label && <span className="text-sm text-text-muted">{label}</span>}
        </div>
    );
}
