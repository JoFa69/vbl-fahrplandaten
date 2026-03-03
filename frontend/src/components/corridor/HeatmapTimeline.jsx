import React, { useState, useEffect, useMemo } from 'react';
import { fetchCorridorHeadway } from '../../api';

export default function HeatmapTimeline({ stopId, tagesart, richtung, showDepotRuns = true, targetHeadway = 10, tolerance = 2 }) {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!stopId) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetchCorridorHeadway(stopId, tagesart, richtung);
                let safeData = res || [];
                if (!showDepotRuns) {
                    safeData = safeData.filter(d => !d.is_depot_run);
                    for (let i = 1; i < safeData.length; i++) {
                        safeData[i].headway_minutes = Math.floor((safeData[i].abfahrt - safeData[i - 1].abfahrt) / 60);
                    }
                }
                safeData = safeData.filter(d => d.headway_minutes != null && d.headway_minutes >= 0 && d.headway_minutes <= 120);
                setRawData(safeData);
            } catch (err) {
                console.error("Failed to load heatmap data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stopId, tagesart, richtung, showDepotRuns]);

    // Aggregate into 30-minute blocks
    const segments = useMemo(() => {
        if (rawData.length === 0) return [];

        const blockSize = 30; // minutes
        const grouped = {};

        rawData.forEach(d => {
            const totalMinutes = d.std * 60 + (d.h_min || 0);
            const blockStart = Math.floor(totalMinutes / blockSize) * blockSize;
            if (!grouped[blockStart]) grouped[blockStart] = [];
            grouped[blockStart].push(d.headway_minutes);
        });

        // Find min/max hour range
        const allBlocks = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        if (allBlocks.length === 0) return [];
        const minBlock = allBlocks[0];
        const maxBlock = allBlocks[allBlocks.length - 1];

        const result = [];
        for (let b = minBlock; b <= maxBlock; b += blockSize) {
            const values = grouped[b] || [];
            const h = Math.floor(b / 60);
            const m = b % 60;
            const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            if (values.length === 0) {
                result.push({ block: b, label, avgDev: null, count: 0, color: '#1F2937', textColor: '#4B5563' });
                continue;
            }

            // Compute average absolute deviation from target
            const avgDev = values.reduce((s, v) => s + Math.abs(v - targetHeadway), 0) / values.length;
            // Compute IQR for stability
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.ceil(sorted.length * 0.75) - 1] || q1;
            const iqr = q3 - q1;

            // Color based on average deviation
            let color, textColor;
            if (avgDev <= tolerance * 0.5) {
                color = '#065F46'; textColor = '#6EE7B7'; // deep green
            } else if (avgDev <= tolerance) {
                color = '#10B981'; textColor = '#ECFDF5'; // green
            } else if (avgDev <= tolerance * 1.5) {
                color = '#D97706'; textColor = '#FEF3C7'; // amber
            } else if (avgDev <= tolerance * 2.5) {
                color = '#EA580C'; textColor = '#FFF7ED'; // orange
            } else {
                color = '#DC2626'; textColor = '#FEF2F2'; // red
            }

            result.push({
                block: b,
                label,
                avgDev: avgDev.toFixed(1),
                iqr: iqr.toFixed(1),
                count: values.length,
                color,
                textColor,
                median: sorted[Math.floor(sorted.length / 2)],
            });
        }

        return result;
    }, [rawData, targetHeadway, tolerance]);

    if (!stopId) return null;

    if (loading) {
        return (
            <div className="h-16 flex justify-center items-center">
                <span className="material-symbols-outlined animate-spin text-xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (segments.length === 0) {
        return (
            <div className="h-16 flex items-center justify-center text-text-muted text-xs">
                Keine Daten für Heatmap verfügbar.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {/* Legend */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }}></span>
                        stabil
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#D97706' }}></span>
                        mäßig
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#DC2626' }}></span>
                        instabil
                    </div>
                </div>
                <span className="text-[10px] text-slate-500">Ø Abweichung vom Soll-Takt | 30-Min-Blöcke</span>
            </div>

            {/* Heatmap strip */}
            <div className="flex w-full h-10 rounded-lg overflow-hidden border border-border-dark">
                {segments.map((seg, i) => (
                    <div
                        key={seg.block}
                        className="flex-1 flex items-center justify-center relative group cursor-default transition-all hover:brightness-125"
                        style={{ backgroundColor: seg.color, minWidth: 0 }}
                        title={`${seg.label}: Ø ${seg.avgDev} Min Abw., ${seg.count} Fahrten`}
                    >
                        {/* Show hour labels at full hours */}
                        {seg.block % 60 === 0 && (
                            <span className="text-[9px] font-mono font-bold" style={{ color: seg.textColor }}>
                                {Math.floor(seg.block / 60)}
                            </span>
                        )}

                        {/* Tooltip on hover */}
                        <div className="absolute inset-x-0 -top-20 z-50 hidden group-hover:flex justify-center pointer-events-none">
                            <div className="bg-[#111318] border border-border-dark rounded-lg p-2 shadow-xl text-[10px] whitespace-nowrap">
                                <p className="text-white font-bold">{seg.label} Uhr</p>
                                <p className="text-slate-400">Ø Abw: <span className="text-white">{seg.avgDev} Min</span></p>
                                <p className="text-slate-400">Fahrten: <span className="text-white">{seg.count}</span></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
