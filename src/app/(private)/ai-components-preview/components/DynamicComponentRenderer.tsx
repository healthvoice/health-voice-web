"use client";

import { AIComponentResponse } from "../types/component-types";
import { SectionRenderer } from "./SectionRenderer";

interface DynamicComponentRendererProps {
  response: AIComponentResponse;
}

// Componente principal que renderiza a resposta completa da IA com seções
export function DynamicComponentRenderer({
  response,
}: DynamicComponentRendererProps) {
  console.log('[DynamicComponentRenderer] response:', response);
  console.log('[DynamicComponentRenderer] response.sections:', response?.sections);
  console.log('[DynamicComponentRenderer] response.sections type:', typeof response?.sections);
  console.log('[DynamicComponentRenderer] response.sections isArray:', Array.isArray(response?.sections));
  console.log('[DynamicComponentRenderer] response.sections?.length:', response?.sections?.length);

  if (!response.sections || response.sections.length === 0) {
    console.log('[DynamicComponentRenderer] No sections or empty, returning empty message');
    return (
      <div className="text-center text-gray-500 py-12">
        <p>Nenhuma seção para exibir</p>
      </div>
    );
  }

  console.log('[DynamicComponentRenderer] Rendering', response.sections.length, 'sections');

  return (
    <div className="animate-in fade-in flex w-full flex-col gap-8 pb-10 duration-500">
      {response.sections.map((section, index) => {
        console.log(`[DynamicComponentRenderer] Rendering section ${index}:`, section);
        console.log(`[DynamicComponentRenderer] Section ${index} full JSON:`, JSON.stringify(section, null, 2));
        console.log(`[DynamicComponentRenderer] Section ${index}.components:`, section.components);
        console.log(`[DynamicComponentRenderer] Section ${index}.components type:`, typeof section.components);
        console.log(`[DynamicComponentRenderer] Section ${index}.components isArray:`, Array.isArray(section.components));
        try {
          return <SectionRenderer key={index} section={section} />;
        } catch (error) {
          console.error(`[DynamicComponentRenderer] Error rendering section ${index}:`, error);
          return (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">Erro ao renderizar seção {index}: {String(error)}</p>
            </div>
          );
        }
      })}
    </div>
  );
}
