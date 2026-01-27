"use client";

import { ExamsCardData, GenericListItem } from "../../types/component-types";
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
  const items = isGenericFormat ? data.items : [];
  
  // Converter formato legado para genérico
  const legacyItems = data.exams ? data.exams.flatMap((ex) => 
    ex.items ? ex.items.map((item) => ({
      id: ex.id,
      primary: item.name,
      secondary: ex.category,
      metadata: [
        { label: "Prioridade", value: item.priority || "Normal" },
      ],
      tags: ex.date ? [ex.date] : [],
    })) : []
  ) : [];

  const displayItems = isGenericFormat ? items : legacyItems;
  const totalCount = data.totalCount || (displayItems?.length || 0);

  // Agrupar items por secondary (categoria) se disponível
  type ItemType = GenericListItem | { id: number; primary: string; secondary: string; metadata: Array<{ label: string; value: string }>; tags: string[] };
  const groupedItems = (displayItems || []).reduce((acc, item) => {
    const groupKey = item.secondary || 'Geral';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, ItemType[]>);

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styles.gradientFrom} ${styles.gradientTo} text-white shadow-md ${styles.shadow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">
            {totalCount} item(ns) no total
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(groupedItems).length > 0 ? Object.entries(groupedItems).map(([category, categoryItems]) => {
          if (!categoryItems) return null;
          return (
          <div
            key={category}
            className={`group relative overflow-hidden rounded-2xl border ${styles.border} bg-white p-5 shadow-sm transition-all hover:shadow-md`}
          >
            <div className="mb-4 flex items-start justify-between border-b border-gray-50 pb-3">
              <div>
                <span className="block text-sm font-bold text-gray-900">
                  {category}
                </span>
                {categoryItems[0]?.tags?.[0] && (
                  <span className="text-xs text-gray-400">{categoryItems[0].tags[0]}</span>
                )}
              </div>
              <span
                className={`rounded-full ${styles.bg} px-2.5 py-1 text-xs font-semibold ${styles.text}`}
              >
                {categoryItems.length} itens
              </span>
            </div>
            <div className="space-y-2">
              {categoryItems.map((item, i) => {
                const priority = item.metadata?.find((m: { label: string; value: string }) => m.label.toLowerCase().includes('prioridade'))?.value || ('status' in item ? item.status : '') || '';
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-blue-50/50"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        priority.toLowerCase().includes("alta")
                          ? "bg-red-400"
                          : priority.toLowerCase().includes("média") || priority.toLowerCase().includes("media")
                            ? "bg-yellow-400"
                            : "bg-blue-400"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.primary}
                    </span>
                  </div>
                );
              })}
            </div>  
          </div>
          );
        }) : (
          <div className="col-span-2 text-center py-8 text-sm text-gray-500">
            Nenhum item disponível
          </div>
        )}
      </div>
    </section>
  );
}
