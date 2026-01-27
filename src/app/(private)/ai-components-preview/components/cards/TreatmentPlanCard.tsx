"use client";

import { CheckCircle2, Pill } from "lucide-react";
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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">Sugestão de conduta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Medicamentos Sugeridos
          </h4>
          <div className="space-y-3">
            {data.treatment && data.treatment.medications && Array.isArray(data.treatment.medications) && data.treatment.medications.length > 0 ? (
              data.treatment.medications.map((med, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-4 transition-all hover:bg-emerald-50`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold ${styles.text}`}>{med.name || 'N/A'}</p>
                      {med.dosage && (
                        <p className={`text-sm ${styles.text} opacity-80`}>
                          {med.dosage}
                        </p>
                      )}
                    </div>
                    {med.frequency && (
                      <span
                        className={`rounded-md border ${styles.border} bg-white px-2 py-1 text-xs font-medium ${styles.text} shadow-sm`}
                      >
                        {med.frequency}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                Nenhum medicamento sugerido
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Estilo de Vida
          </h4>
          <ul className="space-y-2">
            {data.treatment && data.treatment.lifestyle && Array.isArray(data.treatment.lifestyle) && data.treatment.lifestyle.length > 0 ? (
              data.treatment.lifestyle.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 text-sm text-gray-600 hover:border-gray-100 hover:bg-gray-50"
                >
                  <CheckIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                  {item}
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-sm text-gray-500">
                Nenhuma orientação de estilo de vida
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
