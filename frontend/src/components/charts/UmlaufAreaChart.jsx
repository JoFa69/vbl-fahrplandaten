import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UmlaufAreaChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Keine Daten verfügbar</div>;
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded-md shadow-lg">
                    <p className="text-gray-300 text-sm font-semibold mb-1">{label} Uhr</p>
                    <p className="text-blue-400 text-sm">
                        <span className="font-bold">{payload[0].value}</span> Fahrzeuge aktiv
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                    dataKey="time_label"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={20}
                />
                <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="active_count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={800}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
