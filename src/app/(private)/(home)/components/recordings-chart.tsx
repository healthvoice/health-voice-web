"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface RecordingsChartProps {
    data: {
        date: string;
        recordings: number;
    }[];
    className?: string;
}

export function RecordingsChart({ data, className }: RecordingsChartProps) {
    // Custom tooltip component
    const CustomTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean;
        payload?: Array<{ value: number }>;
        label?: string;
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-gray-800">
                        {payload[0].value}{" "}
                        <span className="text-sm font-normal text-gray-400">gravações</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(
                "flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
                className
            )}
        >
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Gravações por Dia
                    </h3>
                    <p className="text-sm text-gray-400">
                        Acompanhe a atividade de gravações
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" />
                    <span className="text-xs text-gray-500">Gravações</span>
                </div>
            </div>

            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0ea5e9" />
                                <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "#f8fafc", radius: 8 }}
                        />
                        <Bar
                            dataKey="recordings"
                            fill="url(#barGradient)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={48}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
