"use client";

import { AlertCircle } from "lucide-react";
import { AllergiesCardData } from "../../types/component-types";
import { getIcon, getVariantStyles } from "../../utils/icon-mapper";

interface AllergiesCardProps {
  title: string;
  variant?: "emerald" | "blue" | "violet" | "amber" | "teal" | "gray" | "rose" | "red";
  data: AllergiesCardData;
}

export function AllergiesCard({
  title,
  variant = "red",
  data,
}: AllergiesCardProps) {
  const styles = getVariantStyles(variant);
  const Icon = getIcon("alert-circle");

  // Detectar formato para calcular item count
  const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
  const items = isGenericFormat ? data.items : [];
  const legacyItems = data.allergies && Array.isArray(data.allergies) ? data.allergies : [];
  const itemCount = isGenericFormat ? items.length : legacyItems.length;
  
  return (
    <div
      className={`h-full w-full ${itemCount === 0 ? 'max-w-[400px] mx-auto' : itemCount <= 2 ? 'max-w-[450px]' : ''} rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={`font-semibold ${variant === "red" ? "text-red-900" : "text-gray-900"}`}>
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {/* Detectar formato: genérico (items[]) ou legado (allergies[]) */}
        {(() => {
          const isGenericFormat = data.items && Array.isArray(data.items) && data.items.length > 0;
          const items = isGenericFormat ? data.items : [];
          
          // Converter formato legado para genérico
          const legacyItems = data.allergies && Array.isArray(data.allergies)
            ? data.allergies.map((allergy) => ({
                primary: allergy.name,
                metadata: [
                  allergy.reaction && { label: "Reação", value: allergy.reaction },
                  allergy.severity && { label: "Severidade", value: allergy.severity },
                ].filter(Boolean) as Array<{ label: string; value: string }>,
              }))
            : [];

          const displayItems = isGenericFormat ? items : legacyItems;

          if (!displayItems || displayItems.length === 0) {
            return (
              <div className="text-center py-4 text-sm text-gray-500">
                Nenhum alerta identificado
              </div>
            );
          }

          return displayItems.map((item, idx) => {
            const severity = item.metadata?.find((m: { label: string; value: string }) => 
              m.label.toLowerCase().includes('severidade')
            )?.value || item.status || '';
            
            return (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-lg border ${styles.border} bg-white p-2 shadow-sm`}
              >
                <span
                  className={`text-sm font-medium ${variant === "red" ? "text-red-900" : "text-gray-900"}`}
                >
                  {item.primary}
                </span>
                {(severity.toLowerCase().includes("alta") || severity.toLowerCase().includes("high")) && (
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-red-500"
                    title="Alta Severidade"
                  ></span>
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
