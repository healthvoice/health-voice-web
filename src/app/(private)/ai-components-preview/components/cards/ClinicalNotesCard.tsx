"use client";

import { FileText } from "lucide-react";
import { ClinicalNotesCardData } from "../../types/component-types";
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

  // Detectar formato: genérico (content/sections) ou legado (notes)
  const content = data.content || data.notes || '';
  const sections = data.sections || [];

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
      <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-6`}>
        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx}>
                {section.title && (
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">
                    {section.title}
                  </h3>
                )}
                <p className="text-sm leading-relaxed text-gray-600 italic">
                  "{section.content}"
                </p>
              </div>
            ))}
          </div>
        ) : content ? (
          <p className="text-sm leading-relaxed text-gray-600 italic">
            "{content}"
          </p>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma observação disponível</p>
        )}
      </div>
    </section>
  );
}
