"use client";

import { MainDiagnosisCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface MainDiagnosisCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: MainDiagnosisCardData;
}

export function MainDiagnosisCard({
  title,
  variant = "blue",
  data,
}: MainDiagnosisCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("stethoscope");
  const ActivityIcon = getIcon("activity");
  const AlertIcon = getIcon("alert-triangle");
  const ClockIcon = getIcon("clock");
  const FileIcon = getIcon("file-text");

  // Detectar formato: genérico (fields[]) ou legado (mainCondition, etc.)
  const isGenericFormat = data.fields && Array.isArray(data.fields) && data.fields.length > 0;
  const fields = Array.isArray(data.fields)
    ? data.fields.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    : [];

  // Converter formato legado para genérico
  const legacyFields = [
    data.mainCondition && { label: "Condição Principal", value: data.mainCondition, variant: "highlight" as const, priority: 1 },
    data.cid && { label: "CID", value: data.cid, priority: 2 },
    data.confidence && { label: "Confiança", value: data.confidence, priority: 3 },
    data.severity && { label: "Severidade", value: data.severity, priority: 4 },
    data.evolution && { label: "Evolução", value: data.evolution, priority: 5 },
  ].filter(Boolean) as typeof fields;

  const displayFields = isGenericFormat ? fields : legacyFields;
  const mainCondition = displayFields.find(f => f.label.toLowerCase().includes('condição') || f.label.toLowerCase().includes('condition'))?.value || data.mainCondition || 'N/A';
  const cid = displayFields.find(f => f.label.toLowerCase().includes('cid'))?.value || data.cid;
  const justification = data.content || data.justification || '';

  return (
    <div
      className={`rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.bg} to-white p-6 shadow-sm ring-1 ${styles.border}/50`}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-lg ${styles.shadow}`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {mainCondition}
              </h2>
              {cid && (
                <span
                  className={`rounded-full border ${styles.border} ${styles.bg} px-2.5 py-0.5 text-xs font-semibold ${styles.text}`}
                >
                  CID: {cid}
                </span>
              )}
            </div>
            <p className="mt-1 text-base text-gray-500">
              Diagnóstico Principal Identificado
            </p>

            {displayFields.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {displayFields.filter(f => 
                  !f.label.toLowerCase().includes('condição') && 
                  !f.label.toLowerCase().includes('condition') &&
                  !f.label.toLowerCase().includes('cid')
                ).map((field, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
                    {field.label.toLowerCase().includes('confiança') || field.label.toLowerCase().includes('confidence') ? (
                      <ActivityIcon className="h-4 w-4 text-emerald-500" />
                    ) : field.label.toLowerCase().includes('severidade') || field.label.toLowerCase().includes('severity') ? (
                      <AlertIcon className="h-4 w-4 text-amber-500" />
                    ) : field.label.toLowerCase().includes('evolução') || field.label.toLowerCase().includes('evolution') ? (
                      <ClockIcon className="h-4 w-4 text-blue-500" />
                    ) : null}
                    {field.label}: <span className="text-gray-900">{field.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {justification && (
        <div className={`mt-6 rounded-xl border ${styles.border} bg-white/60 p-5`}>
          <h3
            className={`mb-2 flex items-center gap-2 text-sm font-semibold ${styles.text}`}
          >
            <FileIcon className="h-4 w-4" />
            Justificativa Clínica
          </h3>
          <p className="leading-relaxed text-gray-700">{justification}</p>
        </div>
      )}
    </div>
  );
}
