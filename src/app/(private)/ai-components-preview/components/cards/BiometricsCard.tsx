"use client";

import { BiometricsCardData } from "../../types/component-types";
import { TruncatedTooltip } from "../core/TruncatedTooltip";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface BiometricsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: BiometricsCardData;
}

export function BiometricsCard({
  title,
  variant = "blue",
  data,
}: BiometricsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("user");

  // Detectar formato: genérico (fields[]) ou legado (personal{})
  const isGenericFormat = data.fields && Array.isArray(data.fields) && data.fields.length > 0;
  const fields = Array.isArray(data.fields)
    ? data.fields.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    : [];

  // Converter formato legado para genérico
  const legacyFields = data.personal
    ? [
        data.personal.bloodType
          ? { label: "Tipo Sanguíneo", value: data.personal.bloodType, variant: "badge" as const, priority: 1 }
          : null,
        data.personal.bmi
          ? { label: "IMC", value: data.personal.bmi, priority: 2 }
          : null,
        data.personal.weight || data.personal.height
          ? {
              label: "Peso / Altura",
              value: `${data.personal.weight || "—"} / ${data.personal.height || "—"}`,
              priority: 3,
            }
          : null,
        data.personal.age
          ? { label: "Idade", value: data.personal.age, priority: 4 }
          : null,
      ].filter(Boolean) as typeof fields
    : [];

  const displayFields = isGenericFormat ? fields : legacyFields;

  return (
    <div
      className={`h-full w-full overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-sm flex flex-col`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${styles.border}`}>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <TruncatedTooltip content={title}>
          <h3 className="font-semibold text-gray-900 leading-snug truncate">{title}</h3>
        </TruncatedTooltip>
      </div>

      {/* Content */}
      <div className="flex flex-col p-5">
        {displayFields.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-50">
            {displayFields.map((field, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-gray-500 font-medium shrink-0">
                  {field.label}
                </span>
                <div className="flex-1 flex justify-end min-w-0">
                  {field.variant === "badge" ? (
                    <span className="rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 whitespace-nowrap">
                      {field.value}
                    </span>
                  ) : field.variant === "highlight" ? (
                    <span className={`text-sm font-bold ${styles.text} break-words text-right`}>
                      {field.value}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 break-words text-right">
                      {field.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-400">
            Dados não disponíveis
          </div>
        )}
      </div>
    </div>
  );
}
