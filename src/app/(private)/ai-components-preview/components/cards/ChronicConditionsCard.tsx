"use client";

import { ChronicConditionsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface ChronicConditionsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "indigo";
  data: ChronicConditionsCardData;
}

export function ChronicConditionsCard({
  title,
  variant = "indigo",
  data,
}: ChronicConditionsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("activity");

  // Detectar formato: genérico (items[]) ou legado (chronicConditions[])
  const isGenericFormat = 'items' in data && Array.isArray(data.items) && data.items.length > 0;
  const items = ('items' in data && Array.isArray(data.items)) ? data.items : [];
  
  // Converter formato legado para genérico
  const legacyItems = data.chronicConditions && Array.isArray(data.chronicConditions) && data.chronicConditions.length > 0
    ? data.chronicConditions.map((condition) => ({
        primary: condition.name || 'N/A',
        metadata: [
          condition.since && { label: "Desde", value: condition.since },
          condition.status && { label: "Status", value: condition.status },
        ].filter(Boolean) as Array<{ label: string; value: string }>,
      }))
    : [];

  const displayItems = isGenericFormat ? items : legacyItems;

  return (
    <div
      className={`h-full rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={`font-semibold ${variant === "indigo" ? "text-indigo-900" : "text-gray-900"}`}>
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
              <div className="flex items-start justify-between">
                <span
                  className={`text-sm font-medium ${variant === "indigo" ? "text-indigo-900" : "text-gray-900"}`}
                >
                  {item.primary}
                </span>
              </div>
              {item.metadata && item.metadata.length > 0 && (
                <span className="mt-0.5 block text-[10px] text-gray-500">
                  {item.metadata.map((meta: { label: string; value: string }, i: number) => (
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
