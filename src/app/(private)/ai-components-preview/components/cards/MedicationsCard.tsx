"use client";

import { MedicationsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface MedicationsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: MedicationsCardData;
}

export function MedicationsCard({
  title,
  variant = "teal",
  data,
}: MedicationsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("pill");

  // Detectar formato: genérico (items[]) ou legado (medications[])
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = Array.isArray(data.items) ? data.items : [];
  
  // Converter formato legado para genérico
  const legacyItems = data.medications && Array.isArray(data.medications)
    ? data.medications.map((med) => ({
        primary: med.name,
        metadata: [
          med.frequency && { label: "Frequência", value: med.frequency },
          med.type && { label: "Tipo", value: med.type },
        ].filter(Boolean) as Array<{ label: string; value: string }>,
      }))
    : [];

  const displayItems = isGenericFormat ? items : legacyItems;

  const itemCount = displayItems.length;
  
  return (
    <div
      className={`h-full w-full ${itemCount <= 2 ? 'max-w-[450px]' : ''} rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={`font-semibold ${variant === "teal" ? "text-teal-900" : "text-gray-900"}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {displayItems && displayItems.length > 0 ? (
          displayItems.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg border ${styles.border} bg-white p-2 shadow-sm`}
            >
              <span
                className={`block text-sm font-medium ${variant === "teal" ? "text-teal-900" : "text-gray-900"}`}
              >
                {item.primary}
              </span>
              {item.metadata && item.metadata.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {item.metadata.map((meta, i) => (
                    <span key={i}>
                      {i > 0 && ' • '}
                      {meta.value}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            Nenhum item disponível
          </div>
        )}
      </div>
    </div>
  );
}
