"use client";

import { ClinicalNotesCardData } from "../../types/component-types";
import { TruncatedTooltip } from "../core/TruncatedTooltip";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface ClinicalNotesCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: ClinicalNotesCardData;
}

export function ClinicalNotesCard({
  title,
  variant = "gray",
  data,
}: ClinicalNotesCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("file-text");

  const content = data.content || data.notes || "";
  const sections = data.sections || [];

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
      <div className="p-5 flex-1">
        {sections.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
              >
                {section.title && (
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {section.title}
                  </h4>
                )}
                <p className="text-sm leading-relaxed text-gray-700 italic break-words">
                  &ldquo;{section.content}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : content ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <p className="text-sm leading-relaxed text-gray-700 italic break-words">
              &ldquo;{content}&rdquo;
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            Nenhum conteúdo disponível
          </div>
        )}
      </div>
    </div>
  );
}
