"use client";

import { PrescriptionCardData } from "../../types/component-types";
import { TruncatedTooltip } from "../core/TruncatedTooltip";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface PrescriptionCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: PrescriptionCardData;
}

export function PrescriptionCard({
  title,
  variant = "emerald",
  data,
}: PrescriptionCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("pill");

  // Detectar formato: genérico (items[]) ou legado (prescriptions[])
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = isGenericFormat ? data.items : [];

  // Converter formato legado para genérico
  const legacyItems = data.prescriptions
    ? data.prescriptions.flatMap((p) =>
        p.items
          ? p.items.map((item) => ({
              id: p.id,
              primary: item.name,
              secondary: p.type,
              metadata: [
                item.dosage ? { label: "Dosagem", value: item.dosage } : null,
                item.frequency ? { label: "Frequência", value: item.frequency } : null,
                item.duration ? { label: "Duração", value: item.duration } : null,
              ].filter(Boolean) as Array<{ label: string; value: string }>,
              tags: p.date ? [p.date] : [],
            }))
          : []
      )
    : [];

  const displayItems = isGenericFormat ? items : legacyItems;
  const itemCount = displayItems?.length || 0;

  return (
    <div
      className={`h-full w-full overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-sm flex flex-col`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${styles.border} ${styles.bg}`}>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <TruncatedTooltip content={title}>
            <h3 className="font-semibold text-gray-900 leading-snug truncate">{title}</h3>
          </TruncatedTooltip>
          <p className="text-xs text-gray-400 mt-0.5">{itemCount} item(ns)</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-5">
        {displayItems && displayItems.length > 0 ? (
          displayItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}
            >
              {/* Tipo / data como label acima */}
              {(item.secondary || item.tags?.[0]) && (
                <div className="flex items-center justify-between gap-2 mb-2">
                  {item.secondary && (
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {item.secondary}
                    </span>
                  )}
                  {item.tags?.[0] && (
                    <span className="text-xs text-gray-400">{item.tags[0]}</span>
                  )}
                </div>
              )}
              {/* Nome do item */}
              <div className="flex items-start justify-between gap-2">
                <p className={`font-semibold leading-snug ${styles.text} flex-1 min-w-0`}>
                  {item.primary}
                </p>
                {"status" in item && item.status && (
                  <span
                    className={`shrink-0 rounded border ${styles.border} bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.text}`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
              {/* Metadata em linha */}
              {item.metadata && item.metadata.length > 0 && (
                <p className={`mt-1 text-sm ${styles.text} opacity-75 leading-relaxed`}>
                  {item.metadata.map((meta, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 opacity-50">•</span>}
                      {meta.value}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            Nenhum item disponível
          </div>
        )}
      </div>
    </div>
  );
}
