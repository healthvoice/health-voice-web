"use client";

import { ExamsCardData, GenericListItem } from "../../types/component-types";
import { TruncatedTooltip } from "../core/TruncatedTooltip";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface ExamsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: ExamsCardData;
}

export function ExamsCard({
  title,
  variant = "blue",
  data,
}: ExamsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("file-output");

  // Detectar formato: genérico (items[]) ou legado (exams[])
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = isGenericFormat ? (data.items || []) : [];

  // Converter formato legado para genérico
  const legacyItems = data.exams
    ? data.exams.flatMap((ex) =>
        ex.items
          ? ex.items.map((item) => ({
              id: ex.id,
              primary: item.name,
              secondary: ex.category,
              metadata: [{ label: "Prioridade", value: item.priority || "Normal" }],
              tags: ex.date ? [ex.date] : [],
            }))
          : []
      )
    : [];

  const displayItems = (isGenericFormat ? items : legacyItems) || [];
  const totalCount = data.totalCount || displayItems.length;

  // Agrupar por categoria (secondary) se os valores forem curtos
  type ItemType = GenericListItem | { id: number; primary: string; secondary: string; metadata: Array<{ label: string; value: string }>; tags: string[] };

  const hasCategories = displayItems.some(
    (item) => item.secondary && typeof item.secondary === "string" && item.secondary.length < 50
  );

  const grouped = hasCategories
    ? displayItems.reduce((acc, item) => {
        const key = item.secondary || "Geral";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, ItemType[]>)
    : null;

  const priorityColor = (value: string) => {
    const v = value.toLowerCase();
    if (v.includes("alta")) return "bg-red-400";
    if (v.includes("média") || v.includes("media")) return "bg-yellow-400";
    return "bg-blue-400";
  };

  const getPriority = (item: ItemType) =>
    item.metadata?.find(
      (m: { label: string; value: string }) =>
        m.label && typeof m.label === "string" && m.label.toLowerCase().includes("prioridade")
    )?.value ||
    ("status" in item ? (item.status as string) : "") ||
    "";

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
          <p className="text-xs text-gray-400 mt-0.5">{totalCount} item(ns)</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-5">
        {displayItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Nenhum item disponível
          </div>
        ) : grouped ? (
          // Renderização agrupada por categoria
          Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
              <div className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b ${styles.border}`}>
                <span className="text-sm font-semibold text-gray-900">{category}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles.text} bg-white/80`}>
                  {categoryItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3">
                {categoryItems.map((item, i) => {
                  const priority = getPriority(item);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 transition-colors hover:bg-gray-50"
                    >
                      {priority && (
                        <div className={`h-2 w-2 shrink-0 rounded-full ${priorityColor(priority)}`} />
                      )}
                      <span className="text-sm text-gray-700 leading-snug flex-1 min-w-0">
                        {item.primary}
                      </span>
                      {item.tags?.[0] && (
                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{item.tags[0]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // Renderização plana (items sem categoria curta)
          displayItems.map((item, i) => {
            const priority = getPriority(item);
            const hasSecondary = item.secondary && typeof item.secondary === "string" && item.secondary.trim().length > 0;
            const hasMetadata = item.metadata && item.metadata.length > 0;

            return (
              <div
                key={("id" in item ? item.id : null) || i}
                className={`rounded-xl border ${styles.border} bg-white p-4 transition-shadow hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {priority && (
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityColor(priority)}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 leading-snug flex-1 min-w-0 break-words">
                        {item.primary}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 shrink-0">
                          {item.tags.map((tag, ti) => (
                            <span
                              key={ti}
                              className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500 whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {hasSecondary && (
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed break-words">
                        {item.secondary}
                      </p>
                    )}
                    {hasMetadata && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.metadata!.map((meta, mi) => (
                          <span
                            key={mi}
                            className="inline-flex items-center gap-1 rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-500"
                          >
                            <span className="text-gray-400">{meta.label}:</span>
                            <span className="text-gray-600">{meta.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
