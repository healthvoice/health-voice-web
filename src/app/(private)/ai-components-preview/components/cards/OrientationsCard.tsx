"use client";

import { CheckCircle, ClipboardCheck } from "lucide-react";
import { OrientationsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface OrientationsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: OrientationsCardData;
}

export function OrientationsCard({
  title,
  variant = "teal",
  data,
}: OrientationsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("clipboard-check");
  const CheckIcon = getIcon("check-circle");

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md ${styles.shadow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-6`}>
        <ul className="space-y-3">
          {data.orientations && Array.isArray(data.orientations) && data.orientations.length > 0 ? (
            data.orientations.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <CheckIcon
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.text}`}
                />
                {item}
              </li>
            ))
          ) : (
            <li className="text-center py-4 text-sm text-gray-500">
              Nenhuma orientação disponível
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
