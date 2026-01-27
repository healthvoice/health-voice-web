"use client";

import { AIComponent, AISection } from "../types/component-types";
import { ComponentRenderer } from "./ComponentRenderer";

interface SectionRendererProps {
  section: AISection;
}

// Componentes que sempre ocupam largura total (não devem estar em grid)
const FULL_WIDTH_COMPONENTS = [
  "main_diagnosis_card",
  "treatment_plan_card",
  "medical_history_timeline_card",
  "orientations_card",
  "clinical_notes_card",
];

// Componentes que podem ocupar 2 colunas ou mais (médio-grande)
const WIDE_COMPONENTS = [
  "prescription_card",
  "exams_card",
  "referrals_card",
  "certificates_card",
  "next_appointments_card",
];

// Componentes compactos que funcionam bem em grid (pequenos-médios)
const COMPACT_COMPONENTS = [
  "biometrics_card",
  "allergies_card",
  "chronic_conditions_card",
  "medications_card",
  "social_history_card",
  "family_history_card",
  "symptoms_card",
  "risk_factors_card",
  "suggested_exams_card",
  "differential_diagnosis_card",
  "observations_card",
];

/**
 * Calcula a quantidade de itens/conteúdo em um componente
 */
function getComponentItemCount(component: AIComponent): number {
  const data = component.data || {};
  
  // Tentar diferentes estruturas de dados usando type guards seguros
  if ('items' in data && Array.isArray(data.items)) return data.items.length;
  if ('fields' in data && Array.isArray(data.fields)) return data.fields.length;
  if ('prescriptions' in data && Array.isArray(data.prescriptions)) {
    return data.prescriptions.reduce((acc: number, p: any) => acc + (p.items?.length || 0), 0);
  }
  if ('exams' in data && Array.isArray(data.exams)) {
    return data.exams.reduce((acc: number, e: any) => acc + (e.items?.length || 0), 0);
  }
  if ('appointments' in data && Array.isArray(data.appointments)) return data.appointments.length;
  if ('symptoms' in data && Array.isArray(data.symptoms)) return data.symptoms.length;
  if ('allergies' in data && Array.isArray(data.allergies)) return data.allergies.length;
  if ('orientations' in data && Array.isArray(data.orientations)) return data.orientations.length;
  if ('referrals' in data && Array.isArray(data.referrals)) return data.referrals.length;
  if ('certificates' in data && Array.isArray(data.certificates)) return data.certificates.length;
  if ('riskFactors' in data && Array.isArray(data.riskFactors)) return data.riskFactors.length;
  if ('familyHistory' in data && Array.isArray(data.familyHistory)) return data.familyHistory.length;
  if ('differentials' in data && Array.isArray(data.differentials)) return data.differentials.length;
  if ('suggestedExams' in data && Array.isArray(data.suggestedExams)) return data.suggestedExams.length;
  if ('personal' in data && typeof data.personal === 'object') {
    return Object.values(data.personal).filter(v => v).length;
  }
  
  return 0;
}

/**
 * Determina quantas colunas um componente deve ocupar baseado no conteúdo
 */
function getComponentSpan(component: AIComponent, totalComponents: number): number {
  const itemCount = getComponentItemCount(component);
  
  // Se é componente de largura total, sempre 1 (mas ocupa toda a linha)
  if (FULL_WIDTH_COMPONENTS.includes(component.type)) {
    return 1; // Será renderizado separadamente
  }
  
  // Se há apenas 1 componente na seção (exceto full-width), limitar largura
  if (totalComponents === 1) {
    if (WIDE_COMPONENTS.includes(component.type)) {
      return 1; // Mas com max-width aplicado no card
    }
    if (COMPACT_COMPONENTS.includes(component.type)) {
      return 1; // Mas com max-width aplicado no card
    }
  }
  
  // Para componentes wide
  if (WIDE_COMPONENTS.includes(component.type)) {
    if (itemCount === 0) return 1;
    if (itemCount <= 2) return 1; // Poucos itens = 1 coluna
    return 1; // Mantém 1 coluna mas pode expandir
  }
  
  // Para componentes compactos
  if (COMPACT_COMPONENTS.includes(component.type)) {
    if (itemCount === 0) return 1;
    if (itemCount >= 4) return 2; // Muitos itens = pode ocupar 2 colunas
    if (itemCount >= 3) {
      // Verificar se tem muitos tags/metadata
      const data = component.data || {};
      const items = ('items' in data && Array.isArray(data.items)) 
        ? data.items 
        : ('symptoms' in data && Array.isArray(data.symptoms))
        ? data.symptoms
        : [];
      const hasManyTags = items.some((item: any) => 
        (item.metadata && item.metadata.length > 2) || 
        (item.tags && item.tags.length > 2)
      );
      return hasManyTags ? 2 : 1;
    }
    return 1; // Poucos itens = 1 coluna
  }
  
  return 1;
}

function categorizeComponents(components: AISection["components"]) {
  const fullWidth: typeof components = [];
  const gridComponents: Array<{ component: AIComponent; span: number }> = [];

  if (!components || !Array.isArray(components)) {
    return { fullWidth, gridComponents };
  }

  const totalComponents = components.length;

  components.forEach((component) => {
    if (FULL_WIDTH_COMPONENTS.includes(component.type)) {
      fullWidth.push(component);
    } else {
      const span = getComponentSpan(component, totalComponents);
      gridComponents.push({ component, span });
    }
  });

  return { fullWidth, gridComponents };
}

export function SectionRenderer({ section }: SectionRendererProps) {
  // Verificar se components existe e é um array
  if (!section.components || !Array.isArray(section.components) || section.components.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            {section.description && (
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            )}
          </div>
        </div>
        <div className="text-center text-gray-500 py-8">
          <p>Nenhum componente disponível nesta seção</p>
        </div>
      </section>
    );
  }

  const { fullWidth, gridComponents } = categorizeComponents(section.components);
  const totalGridComponents = gridComponents.length;

  return (
    <section className="mb-10">
      {/* Header da Seção */}
      <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
          {section.description && (
            <p className="mt-1 text-sm text-gray-500">{section.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Componentes de largura total - Um abaixo do outro */}
        {fullWidth.length > 0 && (
          <div className="flex flex-col gap-6">
            {fullWidth.map((component, idx) => (
              <ComponentRenderer key={`full-${idx}`} component={component} />
            ))}
          </div>
        )}

        {/* Grid inteligente para componentes restantes */}
        {gridComponents.length > 0 && (
          <div 
            className={`grid gap-4 md:gap-6 ${
              totalGridComponents === 1 
                ? 'justify-items-start' // Alinha à esquerda quando há apenas 1 componente
                : ''
            }`}
            style={{
              gridTemplateColumns: totalGridComponents === 1 
                ? 'max-content' // Se há apenas 1 componente, usa apenas o espaço necessário
                : 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', // Múltiplos componentes = grid flexível
            }}
          >
            {gridComponents.map(({ component, span }, idx) => {
              // Se há apenas 1 componente no grid, não aplicar span (deixa o card controlar sua largura)
              const gridColumnSpan = totalGridComponents === 1 ? undefined : span > 1 ? `span ${span}` : undefined;
              
              return (
                <div 
                  key={`grid-${idx}`} 
                  className="h-full w-full"
                  style={gridColumnSpan ? { gridColumn: gridColumnSpan } : undefined}
                >
                  <ComponentRenderer component={component} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
