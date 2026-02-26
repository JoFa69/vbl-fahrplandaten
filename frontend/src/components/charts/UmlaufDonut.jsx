import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function UmlaufDonut({ data }) {
    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-gray-500">Keine Daten verfügbar</div>;
    }

    // Colors: Emerald for Productive, Rose for Unproductive
    const COLORS = ['#10b981', '#f43f5e'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded-md shadow-lg">
                    <p className="text-gray-300 text-sm font-semibold">{data.name}</p>
                    <p className="text-white text-sm mt-1">
                        <span className="font-bold">{data.value.toLocaleString()} h</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    animationDuration={800}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
}
