"use client";

import { BiometricsCardData } from "../../types/component-types";
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

  // Formato legado: converter personal{} para fields[]
  const legacyFields = data.personal ? [
    data.personal.bloodType && { label: "Tipo Sanguíneo", value: data.personal.bloodType, variant: "badge" as const, priority: 1 },
    data.personal.bmi && { label: "IMC", value: data.personal.bmi, priority: 2 },
    (data.personal.weight || data.personal.height) && { 
      label: "Peso / Altura", 
      value: `${data.personal.weight || '-'} / ${data.personal.height || '-'}`, 
      priority: 3 
    },
    data.personal.age && { label: "Idade", value: data.personal.age, priority: 4 },
  ].filter(Boolean) as typeof fields : [];

  const displayFields = isGenericFormat ? fields : legacyFields;

  return (
    <div
      className={`h-full w-full max-w-[500px] rounded-2xl border ${styles.border} bg-white p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {displayFields.length > 0 ? (
          displayFields.map((field, idx) => {
            const isLast = idx === displayFields.length - 1;
            const showBorder = !isLast;
            
            return (
              <div 
                key={idx}
                className={`flex items-start gap-4 ${showBorder ? 'border-b border-gray-50 pb-3' : ''} ${idx === 0 && !isGenericFormat ? 'border-t border-gray-50 pt-2' : ''}`}
              >
                <span className="text-sm text-gray-500 min-w-[140px] flex-shrink-0 font-medium">
                  {field.label}
                </span>
                <div className="flex-1 text-right">
                  {field.variant === "badge" ? (
                    <span className="inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                      {field.value}
                    </span>
                  ) : field.variant === "highlight" ? (
                    <span className={`text-sm font-bold ${styles.text} break-words`}>
                      {field.value}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 break-words text-right">
                      {field.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            Dados não disponíveis
          </div>
        )}
      </div>
    </div>
  );
}
