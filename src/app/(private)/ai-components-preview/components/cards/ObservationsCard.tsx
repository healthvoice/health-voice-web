"use client";

import { Info } from "lucide-react";
import { ObservationsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface ObservationsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: ObservationsCardData;
}

export function ObservationsCard({
  title,
  variant = "amber",
  data,
}: ObservationsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("info");

  return (
    <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {data.observations ? (
        <p className="text-sm leading-relaxed text-gray-600">
          {data.observations}
        </p>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Nenhuma observação disponível
        </p>
      )}
    </div>
  );
}
