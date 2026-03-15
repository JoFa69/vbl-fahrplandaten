import React from 'react';
import GeometryMap from '../GeometryMap';

const VARIANT_COLORS = [
    '#3b82f6', // blue-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#84cc16', // lime-500
];

export default function NetworkRightPanel({
    selectedLine,
    selectedVariant,
    routeData,
    primaryRoutes,
    matrixData,
    matrixLoading,
    matrixDirection,
    setMatrixDirection,
    mapLoading,
    mapHeight,
    isDraggingV,
    handleVariantClick,
    onMapLineSelect,
}) {
    return (
        <div id="netz-right-panel" className="flex-1 h-full flex flex-col min-w-0 min-h-0 relative">
            {selectedLine && matrixData ? (
                <>
                    {/* Map Section */}
                    <div className="relative w-full shrink-0" style={{ height: `${mapHeight}%` }}>
                        <div className="absolute inset-0 flex flex-col">
                            {selectedLine && routeData ? (
                                <GeometryMap
                                    routeData={routeData}
                                    selectedLine={selectedLine.line_no}
                                    selectedVariant={selectedVariant}
                                    primaryRoutes={primaryRoutes}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-1">
                                    {primaryRoutes.length > 0 ? (
                                        <GeometryMap
                                            routeData={null}
                                            selectedLine={null}
                                            primaryRoutes={primaryRoutes}
                                            onLineSelect={onMapLineSelect}
                                        />
                                    ) : (
                                        <div className="w-full h-full map-bg flex items-center justify-center">
                                            <div className="text-center text-text-muted">
                                                <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">map</span>
                                                <h3 className="text-lg font-semibold text-slate-300 mb-1">Kartenansicht</h3>
                                                <p className="text-sm">Wähle eine Linie, um die Route auf der Karte anzuzeigen</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Map loading overlay */}
                            {mapLoading && (
                                <div className="absolute inset-0 bg-bg-dark/70 flex items-center justify-center z-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                        <span className="text-sm text-slate-300">Lade Route...</span>
                                    </div>
                                </div>
                            )}

                            {/* Floating Route Info Card */}
                            {selectedLine && (
                                <div className="absolute top-4 right-4 glass-panel rounded-xl p-4 z-10 max-w-xs pointer-events-none">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-base font-bold shadow-sm">
                                                {selectedLine.line_no}
                                            </span>
                                            <div>
                                                <h4 className="text-base font-semibold text-white">
                                                    {selectedLine.name || 'Route'}
                                                </h4>
                                                <p className="text-sm text-text-muted">
                                                    {selectedVariant
                                                        ? `Variante ${selectedVariant.variant_no} · ${selectedVariant.stop_count} Halte`
                                                        : `${selectedLine.variants} Varianten`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedVariant && (
                                        <div className="flex flex-col gap-3 mt-1">
                                            <p className="text-sm text-slate-400 truncate w-full" title={selectedVariant.route_info}>
                                                {selectedVariant.route_info}
                                            </p>
                                            <button
                                                onClick={() => handleVariantClick(selectedVariant)}
                                                className="px-3 py-1.5 w-full text-[13px] font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white shadow shadow-slate-900 border border-slate-600 flex items-center justify-center gap-1.5 shrink-0 pointer-events-auto"
                                                title="Alle Varianten auf der Karte anzeigen"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">view_list</span>
                                                Alle Varianten anzeigen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vertical Resize Handle */}
                    <div
                        className="w-full h-[6px] bg-slate-800 hover:bg-primary/50 active:bg-primary transition-colors cursor-row-resize flex items-center justify-center shrink-0 z-50 border-t border-slate-700"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            isDraggingV.current = true;
                            document.body.style.cursor = 'row-resize';
                            document.body.style.userSelect = 'none';
                        }}
                    >
                        <div className="w-10 h-1 bg-slate-500 rounded-full" />
                    </div>

                    {/* Matrix Section */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="w-full h-full flex flex-col bg-surface-dark relative z-10 min-h-0">
                            <div className="px-5 py-3 border-b border-border-dark bg-slate-800 flex justify-between items-center shrink-0">
                                <h4 className="text-base font-semibold text-white">Linien-Verlauf (Perlschnur)</h4>
                                <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5">
                                    <button onClick={() => setMatrixDirection(1)} className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${matrixDirection === 1 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hinfahrt</button>
                                    <button onClick={() => setMatrixDirection(2)} className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${matrixDirection === 2 ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Rückfahrt</button>
                                </div>
                            </div>
                            {matrixLoading ? (
                                <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>
                            ) : matrixData && matrixData.matrix.length > 0 ? (
                                <div className="flex-1 min-h-0 overflow-auto bg-[#0a0c10] custom-scrollbar p-0 relative">
                                    <table className="w-full text-left border-collapse" style={{ minWidth: `${matrixData.columns.length * 36 + 80}px` }}>
                                        <thead>
                                            <tr>
                                                <th className="sticky top-0 left-0 bg-[#0a0c10] z-30 px-3 py-2 text-sm font-semibold text-slate-400 border-b border-r border-slate-800 w-[80px] min-w-[80px] max-w-[80px] shadow-sm">
                                                    Variante
                                                </th>
                                                {matrixData.columns.map((col, cIdx) => (
                                                    <th key={col.id} className="sticky top-0 px-0 py-0 border-b border-slate-800 bg-[#0a0c10] w-[36px] h-[180px] align-bottom shadow-sm" style={{ zIndex: 1000 - cIdx }}>
                                                        <div className="relative w-full h-full flex items-end justify-center pb-2">
                                                            <span className="absolute whitespace-nowrap text-[13px] font-medium tracking-wide text-slate-300 hover:text-white hover:z-40 cursor-default transition-colors"
                                                                style={{ left: '50%', bottom: 12, transformOrigin: '0% 100%', transform: 'rotate(-50deg)' }}
                                                                title={col.name}>
                                                                {col.name}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matrixData.matrix.map((row) => {
                                                const color = VARIANT_COLORS[parseInt(row.id) % VARIANT_COLORS.length];
                                                const isSelected = selectedVariant?.id === row.id;

                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-900/80'}`}
                                                        onClick={() => handleVariantClick({ id: row.id, variant_no: row.id, stop_count: row.stops.length, route_info: 'Ausgewählt' })}
                                                    >
                                                        <td className={`sticky left-0 ${isSelected ? 'bg-slate-800' : 'bg-[#0a0c10]'} z-20 px-3 py-2 border-b border-r border-slate-800 transition-colors w-[80px] min-w-[80px] max-w-[80px]`}>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span className="text-xs font-bold text-slate-200 whitespace-nowrap leading-tight">Var {row.id}</span>
                                                                    <span className="text-[11px] font-medium text-white leading-none bg-slate-700/80 px-1.5 py-0.5 rounded">{row.frequency} F.</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {matrixData.columns.map(col => {
                                                            const hasStop = row.stops.includes(col.id);
                                                            const isFirst = row.stops[0] === col.id;
                                                            const isLast = row.stops[row.stops.length - 1] === col.id;

                                                            return (
                                                                <td key={col.id} className="px-0 py-2 border-b border-slate-800 text-center relative group">
                                                                    {hasStop && (
                                                                        <div className="absolute inset-0 flex items-center">
                                                                            <div
                                                                                className="h-[3px] w-full"
                                                                                style={{
                                                                                    backgroundColor: color,
                                                                                    opacity: 0.8,
                                                                                    marginLeft: isFirst ? '50%' : '0',
                                                                                    width: isFirst || isLast ? '50%' : '100%',
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                    )}
                                                                    {hasStop && (
                                                                        <div
                                                                            className="relative z-10 mx-auto w-3.5 h-3.5 rounded-full border-2 border-[#0a0c10] shadow-sm transform group-hover:scale-125 transition-transform"
                                                                            style={{ backgroundColor: color }}
                                                                        ></div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                    Keine Varianten-Daten gefunden.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 relative">
                    <div className="absolute inset-0 flex flex-col">
                        {primaryRoutes.length > 0 ? (
                            <GeometryMap
                                routeData={null}
                                selectedLine={null}
                                primaryRoutes={primaryRoutes}
                                onLineSelect={onMapLineSelect}
                            />
                        ) : (
                            <div className="w-full h-full map-bg flex items-center justify-center">
                                <div className="text-center text-text-muted">
                                    <span className="material-symbols-outlined text-5xl mb-4 block text-slate-600">map</span>
                                    <h3 className="text-lg font-semibold text-slate-300 mb-1">Kartenansicht</h3>
                                    <p className="text-sm">Wähle eine Linie, um die Route auf der Karte anzuzeigen</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
