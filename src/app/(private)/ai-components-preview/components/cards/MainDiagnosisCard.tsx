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

  // Detectar formato: genérico (fields[]) ou legado
  const isGenericFormat = data.fields && Array.isArray(data.fields) && data.fields.length > 0;
  const fields = Array.isArray(data.fields)
    ? data.fields.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    : [];

  // Converter formato legado para genérico
  const legacyFields = [
    data.mainCondition ? { label: "Condição Principal", value: data.mainCondition, variant: "highlight" as const, priority: 1 } : null,
    data.cid ? { label: "CID", value: data.cid, priority: 2 } : null,
    data.confidence ? { label: "Confiança", value: data.confidence, priority: 3 } : null,
    data.severity ? { label: "Severidade", value: data.severity, priority: 4 } : null,
    data.evolution ? { label: "Evolução", value: data.evolution, priority: 5 } : null,
  ].filter(Boolean) as typeof fields;

  const displayFields = isGenericFormat ? fields : legacyFields;

  const mainCondition =
    displayFields.find(
      (f) =>
        f.label && typeof f.label === "string" &&
        (f.label.toLowerCase().includes("condição") || f.label.toLowerCase().includes("condition"))
    )?.value ||
    data.mainCondition ||
    "N/A";

  const cid =
    displayFields.find(
      (f) => f.label && typeof f.label === "string" && f.label.toLowerCase().includes("cid")
    )?.value || data.cid;

  const justification = data.content || data.justification || "";

  // Campos extras (exceto condição e CID)
  const extraFields = displayFields.filter(
    (f) =>
      f.label && typeof f.label === "string" &&
      !f.label.toLowerCase().includes("condição") &&
      !f.label.toLowerCase().includes("condition") &&
      !f.label.toLowerCase().includes("cid")
  );

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-sm`}
    >
      {/* Hero header com gradiente */}
      <div
        className={`flex items-start gap-4 ${styles.bg} px-6 py-5`}
      >
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 break-words leading-snug">
              {mainCondition}
            </h2>
            {cid && (
              <span
                className={`shrink-0 rounded-full border ${styles.border} ${styles.bg} px-2.5 py-0.5 text-xs font-semibold ${styles.text}`}
              >
                CID: {cid}
              </span>
            )}
          </div>

          {/* Chips de atributos extras */}
          {extraFields.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {extraFields.map((field, idx) => {
                const labelStr = typeof field.label === "string" ? field.label : String(field.label || "");
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200"
                  >
                    {labelStr.toLowerCase().includes("confiança") || labelStr.toLowerCase().includes("confidence") ? (
                      <ActivityIcon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : labelStr.toLowerCase().includes("severidade") || labelStr.toLowerCase().includes("severity") ? (
                      <AlertIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    ) : labelStr.toLowerCase().includes("evolução") || labelStr.toLowerCase().includes("evolution") ? (
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    ) : null}
                    <span>
                      {labelStr}:{" "}
                      <span className="text-gray-900 font-semibold">{field.value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Justificativa */}
      {justification && (
        <div className={`border-t ${styles.border} px-6 py-4`}>
          <h3 className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${styles.text}`}>
            <FileIcon className="h-4 w-4 shrink-0" />
            Justificativa
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 break-words">{justification}</p>
        </div>
      )}
    </div>
  );
}
