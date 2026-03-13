'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

interface CategoryChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{payload[0].name}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 italic text-sm">
                Sem dados para exibir no momento.
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1200}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
