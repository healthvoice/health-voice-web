"use client";

import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "primary" | "success" | "warning" | "info";
    className?: string;
}

// Unified style - all variants now use white background with blue accent
const variantStyles = {
    primary: {
        iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
        border: "border-sky-200",
    },
    success: {
        iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
        border: "border-sky-200",
    },
    warning: {
        iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
        border: "border-sky-200",
    },
    info: {
        iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
        border: "border-sky-200",
    },
};

export function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "primary",
    className,
}: KPICardProps) {
    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/5",
                styles.border,
                className
            )}
        >
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:scale-150" />

            <div className="relative flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {title}
                    </span>
                    <span className="text-3xl font-bold text-gray-800">{value}</span>
                    {subtitle && (
                        <span className="text-xs text-gray-400">{subtitle}</span>
                    )}
                    {trend && (
                        <div className="mt-1 flex items-center gap-1">
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    trend.isPositive ? "text-emerald-600" : "text-rose-600"
                                )}
                            >
                                {trend.isPositive ? "+" : "-"}
                                {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-gray-400">vs. mês anterior</span>
                        </div>
                    )}
                </div>

                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                        styles.iconGradient
                    )}
                >
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
}
