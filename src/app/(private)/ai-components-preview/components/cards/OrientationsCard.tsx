"use client";

import { OrientationsCardData } from "../../types/component-types";
import { TruncatedTooltip } from "../core/TruncatedTooltip";
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

  const items = data.orientations && Array.isArray(data.orientations) ? data.orientations : [];

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
        <div className="min-w-0 flex-1">
          <TruncatedTooltip content={title}>
            <h3 className="font-semibold text-gray-900 leading-snug truncate">{title}</h3>
          </TruncatedTooltip>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{items.length} orientação(ões)</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-0 p-5 ${styles.bg} rounded-b-2xl flex-1`}>
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-700 leading-relaxed"
              >
                <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.text}`} />
                <span className="break-words min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            Nenhuma orientação disponível
          </div>
        )}
      </div>
    </div>
  );
}
