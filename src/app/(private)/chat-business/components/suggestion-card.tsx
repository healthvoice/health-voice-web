"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SuggestionCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  index?: number;
}

export function SuggestionCard({
  title,
  icon: Icon,
  onClick,
  index = 0,
}: SuggestionCardProps) {
  // Reusing the "primary" variant style from KPICard for consistency
  const styles = {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-blue-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-2 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/5",
        styles.border,
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:scale-150" />

      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110",
            styles.iconGradient,
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        <h3 className="text-sm leading-tight font-semibold text-gray-800">
          {title}
        </h3>
      </div>
    </motion.div>
  );
}
