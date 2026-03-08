"use client";

import { TreatmentPlanCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface TreatmentPlanCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: TreatmentPlanCardData;
}

export function TreatmentPlanCard({
  title,
  variant = "emerald",
  data,
}: TreatmentPlanCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("pill");
  const CheckIcon = getIcon("check-circle2");

  const hasMedications =
    data.treatment?.medications &&
    Array.isArray(data.treatment.medications) &&
    data.treatment.medications.length > 0;
  const hasLifestyle =
    data.treatment?.lifestyle &&
    Array.isArray(data.treatment.lifestyle) &&
    data.treatment.lifestyle.length > 0;

  if (!hasMedications && !hasLifestyle) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-sm`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${styles.border}`}>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>
        </div>
      </div>

      {/* Content — 2 colunas em telas médias */}
      <div className="grid grid-cols-1 gap-0 divide-y divide-gray-50 md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Implementação (medicamentos) */}
        <div className="p-5">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <svg viewBox="0 0 6 6" fill="currentColor" className={`h-1.5 w-1.5 shrink-0 ${styles.iconText}`}><circle cx="3" cy="3" r="3"/></svg>
            Implementação
          </h4>
          {hasMedications ? (
            <div className="flex flex-col gap-2">
              {data.treatment!.medications!.map((med, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border ${styles.border} ${styles.bg} p-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold leading-snug ${styles.text} break-words`}>
                        {med.name || "N/A"}
                      </p>
                      {med.dosage && (
                        <p className={`mt-0.5 text-sm ${styles.text} opacity-75`}>{med.dosage}</p>
                      )}
                    </div>
                    {med.frequency && (
                      <span
                        className={`shrink-0 rounded-md border ${styles.border} bg-white px-2 py-0.5 text-xs font-medium ${styles.text} whitespace-nowrap`}
                      >
                        {med.frequency}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma implementação sugerida</p>
          )}
        </div>

        {/* Orientações (lifestyle) */}
        <div className="p-5">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Orientações
          </h4>
          {hasLifestyle ? (
            <ul className="flex flex-col gap-1.5">
              {data.treatment!.lifestyle!.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 text-sm text-gray-600 hover:border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span className="break-words leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma orientação sugerida</p>
          )}
        </div>
      </div>
    </div>
  );
}
