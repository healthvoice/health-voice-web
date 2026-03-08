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
  const legacyItems =
    data.medications && Array.isArray(data.medications)
      ? data.medications.map((med) => ({
          primary: med.name,
          metadata: [
            med.frequency ? { label: "Frequência", value: med.frequency } : null,
            med.type ? { label: "Tipo", value: med.type } : null,
          ].filter(Boolean) as Array<{ label: string; value: string }>,
        }))
      : [];

  const displayItems = isGenericFormat ? items : legacyItems;

  return (
    <div
      className={`h-full w-full overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} shadow-sm flex flex-col`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${styles.border}`}>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold leading-snug truncate text-gray-900">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {displayItems && displayItems.length > 0 ? (
          displayItems.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg border ${styles.border} bg-white px-3 py-2.5 shadow-sm`}
            >
              <p className={`text-sm font-semibold leading-snug ${styles.text}`}>
                {item.primary}
              </p>
              {item.metadata && item.metadata.length > 0 && (
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">
                  {item.metadata.map((meta, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1">·</span>}
                      {meta.value}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-sm text-gray-400">
            Nenhum item disponível
          </div>
        )}
      </div>
    </div>
  );
}
