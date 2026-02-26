import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UmlaufHistogram({ data }) {
    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Keine Daten verfügbar</div>;
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded-md shadow-lg">
                    <p className="text-gray-300 text-sm font-semibold mb-1">Dauer: {label}</p>
                    <p className="text-indigo-400 text-sm">
                        <span className="font-bold">{payload[0].value}</span> Umläufe
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                    dataKey="label"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                />
                <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip cursor={{ fill: '#374151', opacity: 0.4 }} content={<CustomTooltip />} />
                <Bar
                    dataKey="anzahl"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
