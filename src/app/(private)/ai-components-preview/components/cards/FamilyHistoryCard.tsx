"use client";

import { Dna } from "lucide-react";
import { FamilyHistoryCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface FamilyHistoryCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "neutral";
  data: FamilyHistoryCardData;
}

export function FamilyHistoryCard({
  title,
  variant = "neutral",
  data,
}: FamilyHistoryCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("dna");

  return (
    <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
        <Icon className="h-5 w-5 text-gray-400" />
        {title}
      </h3>
      <div className="space-y-4">
        {data.familyHistory && Array.isArray(data.familyHistory) && data.familyHistory.length > 0 ? (
          data.familyHistory.map((item, idx) => (
            <div
              key={idx}
              className="relative border-l-2 border-dashed border-gray-200 pl-4"
            >
              <p className="text-sm font-bold text-gray-800">{item.relation || 'N/A'}</p>
              <p className="text-sm text-gray-600">{item.condition || 'N/A'}</p>
              {item.age && (
                <p className="mt-1 text-xs text-gray-400">
                  Diagnóstico: {item.age}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            Nenhum histórico familiar disponível
          </div>
        )}
      </div>
    </div>
  );
}
