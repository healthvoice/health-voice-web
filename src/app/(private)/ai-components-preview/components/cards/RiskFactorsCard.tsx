"use client";

import { AlertTriangle } from "lucide-react";
import { RiskFactorsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface RiskFactorsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "orange";
  data: RiskFactorsCardData;
}

export function RiskFactorsCard({
  title,
  variant = "orange",
  data,
}: RiskFactorsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("alert-triangle");

  return (
    <div
      className={`h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="mb-5 flex items-center gap-3 border-b border-gray-50 pb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">Agravantes identificados</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.riskFactors && Array.isArray(data.riskFactors) && data.riskFactors.length > 0 ? (
          data.riskFactors.map((factor, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center rounded-lg border ${styles.border} ${styles.bg} px-3 py-1.5 text-sm font-medium ${styles.text}`}
            >
              {factor}
            </span>
          ))
        ) : (
          <div className="w-full text-center py-4 text-sm text-gray-500">
            Nenhum fator de risco identificado
          </div>
        )}
      </div>
    </div>
  );
}
