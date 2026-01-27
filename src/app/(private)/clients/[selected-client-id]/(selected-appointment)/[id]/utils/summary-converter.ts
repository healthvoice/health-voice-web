import { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";

/**
 * Converte um resumo estruturado (structuredSummary ou specificSummary) para o formato AIComponentResponse.
 * Suporta tanto o formato antigo (com components[]) quanto o novo (com sections[]).
 */
export function convertToAIComponentResponse(
  summary: any,
): AIComponentResponse | null {
  console.log('[convertToAIComponentResponse] Input summary:', summary);
  console.log('[convertToAIComponentResponse] summary type:', typeof summary);
  console.log('[convertToAIComponentResponse] summary.sections:', summary?.sections);
  console.log('[convertToAIComponentResponse] summary.sections isArray:', Array.isArray(summary?.sections));

  if (!summary) {
    console.log('[convertToAIComponentResponse] Summary is null/undefined, returning null');
    return null;
  }

  // Se já está no formato correto com sections
  if (summary.sections && Array.isArray(summary.sections)) {
    console.log('[convertToAIComponentResponse] Found sections array, length:', summary.sections.length);
    
    // Garantir que cada seção tem components válido
    const validSections = summary.sections.map((section: any, index: number) => {
      console.log(`[convertToAIComponentResponse] Section ${index}:`, section);
      console.log(`[convertToAIComponentResponse] Section ${index}.components:`, section.components);
      console.log(`[convertToAIComponentResponse] Section ${index}.components isArray:`, Array.isArray(section.components));
      
      return {
        ...section,
        components: Array.isArray(section.components) ? section.components : [],
      };
    });
    
    console.log('[convertToAIComponentResponse] Valid sections:', validSections);
    
    const result = {
      pageTitle: summary.pageTitle || "Resumo Estruturado",
      sections: validSections,
    };
    
    console.log('[convertToAIComponentResponse] Returning result:', result);
    return result;
  }

  // Se está no formato antigo com components, converter para o novo formato
  if (summary.components && Array.isArray(summary.components)) {
    return {
      pageTitle: summary.pageTitle || "Resumo Estruturado",
      sections: [
        {
          title: "Componentes",
          components: summary.components,
        },
      ],
    };
  }

  // Se não tem nem sections nem components, retorna null
  return null;
}
