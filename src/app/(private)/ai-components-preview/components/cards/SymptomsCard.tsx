"use client";

import { Activity } from "lucide-react";
import { SymptomsCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface SymptomsCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose";
  data: SymptomsCardData;
}

export function SymptomsCard({
  title,
  variant = "rose",
  data,
}: SymptomsCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("activity");

  // Detectar formato: genérico (items[]) ou legado (symptoms[])
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = isGenericFormat ? data.items : [];
  
  // Converter formato legado para genérico
  const legacyItems = data.symptoms ? data.symptoms.map((symptom) => ({
    primary: symptom.name,
    metadata: [
      symptom.frequency && { label: "Frequência", value: symptom.frequency },
      symptom.severity && { label: "Severidade", value: symptom.severity },
    ].filter(Boolean) as Array<{ label: string; value: string }>,
  })) : [];

  const displayItems = isGenericFormat ? items : legacyItems;

  // Calcular se precisa de mais espaço baseado no conteúdo
  const itemCount = displayItems.length;
  const hasManyTags = displayItems.some(item => 
    (item.metadata && item.metadata.length > 1) || 
    (item.tags && item.tags.length > 1)
  );
  
  return (
    <div
      className={`h-full w-full ${itemCount >= 3 || hasManyTags ? 'max-w-none' : 'max-w-[500px]'} rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="mb-5 flex items-center gap-3 border-b border-gray-50 pb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">Itens identificados</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {displayItems.length > 0 ? (
          displayItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="font-medium text-gray-700">{item.primary}</span>
                {item.secondary && (
                  <span className="text-xs text-gray-500">{item.secondary}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.metadata && item.metadata.length > 0 && item.metadata.map((meta, i) => (
                  <span key={i} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">
                    {meta.value}
                  </span>
                ))}
                {item.tags && item.tags.map((tag, i) => (
                  <span key={i} className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            Nenhum item identificado
          </div>
        )}
      </div>
    </div>
  );
}
