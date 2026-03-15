import React, { useState } from 'react';

/**
 * Accordion-style collapsible section.
 * title: header text
 * defaultOpen: whether to start expanded
 */
export default function Collapsible({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-bg-card border border-border-dark rounded-lg overflow-hidden">
            <button
                className="w-full px-5 py-4 flex items-center justify-between text-white font-medium hover:bg-white/5 transition-colors"
                onClick={() => setOpen((o) => !o)}
            >
                <span>{title}</span>
                <span className={`material-symbols-outlined text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>
            {open && (
                <div className="border-t border-border-dark">
                    {children}
                </div>
            )}
        </div>
    );
}
