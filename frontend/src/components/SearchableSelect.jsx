import React, { useState, useRef, useEffect, useMemo } from 'react';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Auswählen...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    // Find the currently selected option
    const selectedOption = useMemo(
        () => options.find(opt => opt.value === value),
        [options, value]
    );

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerTerm)
        );
    }, [options, searchTerm]);

    // Close dropdown when interacting outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (selectedValue) => {
        onChange({ target: { value: selectedValue } }); // Mock event to match standard select API
        setIsOpen(false);
        setSearchTerm(""); // Reset search when closed
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Display / Toggle Button */}
            <div
                className="bg-surface-dark border border-primary/30 text-white text-sm font-bold rounded-lg p-2.5 flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="material-symbols-outlined text-primary/70 text-lg">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-surface-dark border border-primary/30 rounded-lg shadow-xl shadow-black max-h-64 flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-white/5 sticky top-0 bg-surface-dark/95 backdrop-blur-md z-10 rounded-t-lg">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-2 text-primary/50 text-sm">
                                search
                            </span>
                            <input
                                type="text"
                                className="w-full bg-black/40 text-white text-sm rounded-md pl-8 pr-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/30"
                                placeholder="Suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto overflow-x-hidden p-1 flex-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="text-white/40 text-sm text-center py-4">
                                Keine Treffer gefunden
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${opt.value === value
                                            ? 'bg-primary/20 text-primary font-bold'
                                            : 'text-white hover:bg-white/5'
                                        }`}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
