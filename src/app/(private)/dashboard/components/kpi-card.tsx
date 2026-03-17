"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

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

// Distinct styles per variant
const variantStyles = {
  primary: {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-sky-100",
    bg: "bg-white",
  },
  success: {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-sky-100",
    bg: "bg-white",
  },
  warning: {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-sky-100",
    bg: "bg-white",
  },
  info: {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-sky-100",
    bg: "bg-white",
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
        "group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-black/5",
        styles.border,
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
            {title}
          </span>
          <span className="text-2xl font-bold text-gray-800">{value}</span>
          {subtitle && (
            <span className="text-xs text-gray-400">{subtitle}</span>
          )}
          {/* {trend && ( 
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
                            <span className="text-[11px] text-gray-400">vs. anterior</span>
                        </div>
                    )}*/}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
            styles.iconGradient,
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
