import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';

// Custom diverging color palette: Cyan -> Yellow -> Orange -> Red -> Purple
const COLOR_RANGE = ['#22d3ee', '#fcd34d', '#f97316', '#ef4444', '#9333ea'];

export default function MapComponent({ data = [] }) {
    const validData = useMemo(() => data.filter(s => s.lat && s.lon), [data]);

    const { radiusScale, colorScale, bounds, maxLines, maxFreq } = useMemo(() => {
        if (!validData.length) return { radiusScale: () => 5, colorScale: () => '#3b82f6', bounds: null, maxLines: 0, maxFreq: 0 };

        const mFreq = d3.max(validData, d => d.frequency) || 1;
        const mLines = d3.max(validData, d => d.lines) || 1;

        const rScale = d3.scaleSqrt().domain([0, mFreq]).range([4, 25]);

        // Multi-stop color scale interpolation
        const cScale = d3.scaleSequential()
            .domain([0, mLines])
            .interpolator(
                d3.piecewise(d3.interpolateHslLong, COLOR_RANGE)
            );

        const lats = validData.map(d => d.lat);
        const lngs = validData.map(d => d.lon);
        const b = [
            [Math.min(...lats) - 0.005, Math.min(...lngs) - 0.005],
            [Math.max(...lats) + 0.005, Math.max(...lngs) + 0.005],
        ];

        return { radiusScale: rScale, colorScale: cScale, bounds: b, maxLines: mLines, maxFreq: mFreq };
    }, [validData]);

    if (!validData.length) {
        return (
            <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Keine Geodaten verfügbar
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                bounds={bounds}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', borderRadius: '0.75rem', background: '#101622' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {validData.map((stop) => {
                    const r = radiusScale(stop.frequency);
                    const fill = colorScale(stop.lines);
                    // Higher opacity for nodes with more lines
                    const opacity = 0.4 + Math.min(0.5, (stop.lines / maxLines) * 0.5);
                    return (
                        <CircleMarker
                            key={stop.stop_id}
                            center={[stop.lat, stop.lon]}
                            radius={r}
                            pathOptions={{
                                fillColor: fill,
                                fillOpacity: opacity,
                                color: '#101622', // Dark border to separate overlapping bubbles
                                weight: 1.5,
                                opacity: 0.8,
                            }}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -r]}
                                className="chart-tooltip-leaflet"
                            >
                                <div style={{
                                    background: '#1c2433',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                    lineHeight: 1.5,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                }}>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{stop.stop_name}</div>
                                    <div style={{ color: '#94a3b8' }}>
                                        Frequenz: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stop.frequency.toLocaleString()}</span> Fahrten/Tag
                                    </div>
                                    <div style={{ color: '#94a3b8' }}>
                                        Linien: <span style={{ color: fill, fontWeight: 700 }}>{stop.lines}</span>
                                    </div>
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
            </MapContainer>

            {/* Custom Map Legend */}
            <div className="absolute bottom-4 right-4 z-[400] bg-surface-dark/90 backdrop-blur-md border border-border-dark p-3 rounded-xl flex flex-col gap-3 shadow-xl">
                <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Anzahl Linien</span>
                    <div className="flex h-3 w-40 rounded overflow-hidden" style={{ background: `linear-gradient(to right, ${COLOR_RANGE.join(', ')})` }} />
                    <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-mono">
                        <span>1</span>
                        <span>{Math.floor(maxLines / 2)}</span>
                        <span>{maxLines}</span>
                    </div>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Tages-Frequenz</span>
                    <div className="flex items-end gap-3 px-1">
                        <div className="flex flex-col items-center gap-1">
                            <div className="rounded-full bg-slate-500/50 border border-slate-400" style={{ width: 8, height: 8 }} />
                            <span className="text-[9px] text-slate-400 font-mono">~10</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="rounded-full bg-slate-500/50 border border-slate-400" style={{ width: 20, height: 20 }} />
                            <span className="text-[9px] text-slate-400 font-mono">~{(Math.floor(maxFreq / 2)).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="rounded-full bg-slate-500/50 border border-slate-400" style={{ width: 50, height: 50 }} />
                            <span className="text-[9px] text-slate-400 font-mono">{maxFreq.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
