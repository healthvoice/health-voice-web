"use client";

import { Activity, Cigarette, Users, Wine } from "lucide-react";
import { SocialHistoryCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface SocialHistoryCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "neutral";
  data: SocialHistoryCardData;
}

export function SocialHistoryCard({
  title,
  variant = "neutral",
  data,
}: SocialHistoryCardProps) {
  const styles = getVariantStyles(variant);
  const UsersIcon = getIcon("users");

  // Detectar formato: genérico (fields[]) ou legado (socialHistory{})
  const isGenericFormat = data.fields && Array.isArray(data.fields) && data.fields.length > 0;
  const fields = isGenericFormat 
    ? data.fields.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    : [];

  // Converter formato legado para genérico
  const legacyFields = data.socialHistory ? [
    data.socialHistory.smoking && { label: "Tabagismo", value: data.socialHistory.smoking, priority: 1 },
    data.socialHistory.alcohol && { label: "Consumo de Álcool", value: data.socialHistory.alcohol, priority: 2 },
    data.socialHistory.activity && { label: "Atividade Física", value: data.socialHistory.activity, priority: 3 },
    data.socialHistory.diet && { label: "Dieta", value: data.socialHistory.diet, priority: 4 },
  ].filter(Boolean) as typeof fields : [];

  const displayFields = isGenericFormat ? fields : legacyFields;

  return (
    <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
        <UsersIcon className="h-5 w-5 text-gray-400" />
        {title}
      </h3>
      <div className="space-y-4">
        {displayFields.length > 0 ? displayFields.map((field, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-900">{field.label}</p>
              <p className="text-sm text-gray-500">{field.value}</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-4 text-sm text-gray-500">
            Dados não disponíveis
          </div>
        )}
      </div>
    </div>
  );
}
