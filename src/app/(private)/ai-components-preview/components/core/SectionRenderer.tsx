"use client";

import { Copy, Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { AIComponent, AISection } from "../../types/component-types";
import { hasValidComponentData } from "../../utils/component-data-checker";
import { CardEditForm } from "../CardEditForm";
import { ComponentRenderer } from "./ComponentRenderer";

interface SectionRendererProps {
  section: AISection;
  sectionIndex?: number;
  showCardActions?: boolean;
  clientId?: string;
  recordingId?: string;
  onUpdateComponent?: (
    sectionIndex: number,
    componentIndex: number,
    updated: AIComponent,
  ) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

// Componentes que sempre ocupam largura total
const FULL_WIDTH_COMPONENTS = [
  "main_diagnosis_card",
  "treatment_plan_card",
  "medical_history_timeline_card",
  "orientations_card",
  "clinical_notes_card",
];

// Componentes de largura média-grande (beneficiam de mais espaço)
const WIDE_COMPONENTS = [
  "prescription_card",
  "exams_card",
  "referrals_card",
  "certificates_card",
  "next_appointments_card",
];

// Componentes compactos (funcionam bem lado a lado)
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
 * Conta itens de conteúdo de um componente
 */
function getComponentItemCount(component: AIComponent): number {
  const data = component.data || {};
  if ("items" in data && Array.isArray(data.items)) return data.items.length;
  if ("fields" in data && Array.isArray(data.fields)) return data.fields.length;
  if ("prescriptions" in data && Array.isArray(data.prescriptions))
    return (data.prescriptions as any[]).reduce((acc, p) => acc + (p.items?.length || 0), 0);
  if ("exams" in data && Array.isArray(data.exams))
    return (data.exams as any[]).reduce((acc, e) => acc + (e.items?.length || 0), 0);
  if ("appointments" in data && Array.isArray(data.appointments))
    return (data.appointments as any[]).length;
  if ("symptoms" in data && Array.isArray(data.symptoms))
    return (data.symptoms as any[]).length;
  if ("allergies" in data && Array.isArray(data.allergies))
    return (data.allergies as any[]).length;
  if ("orientations" in data && Array.isArray(data.orientations))
    return (data.orientations as any[]).length;
  if ("referrals" in data && Array.isArray(data.referrals))
    return (data.referrals as any[]).length;
  if ("certificates" in data && Array.isArray(data.certificates))
    return (data.certificates as any[]).length;
  if ("riskFactors" in data && Array.isArray(data.riskFactors))
    return (data.riskFactors as any[]).length;
  if ("familyHistory" in data && Array.isArray(data.familyHistory))
    return (data.familyHistory as any[]).length;
  if ("differentials" in data && Array.isArray(data.differentials))
    return (data.differentials as any[]).length;
  if ("suggestedExams" in data && Array.isArray(data.suggestedExams))
    return (data.suggestedExams as any[]).length;
  if ("personal" in data && typeof data.personal === "object")
    return Object.values(data.personal as object).filter(Boolean).length;
  return 0;
}

/**
 * Formata o conteúdo do componente como texto legível para o botão Copiar.
 */
function getComponentCopyText(component: AIComponent): string {
  const d = (component.data ?? {}) as Record<string, unknown>;
  const lines: string[] = [component.title, ""];

  if (Array.isArray(d.orientations) && d.orientations.length > 0) {
    (d.orientations as string[]).forEach((item) => lines.push(`• ${item}`));
    return lines.join("\n");
  }
  if (Array.isArray(d.riskFactors) && d.riskFactors.length > 0) {
    (d.riskFactors as string[]).forEach((item) => lines.push(`• ${item}`));
    return lines.join("\n");
  }
  if (typeof d.observations === "string" && d.observations) {
    lines.push(d.observations);
    return lines.join("\n");
  }
  if (Array.isArray(d.sections) && d.sections.length > 0) {
    (d.sections as Array<{ title?: string; content: string }>).forEach((sec) => {
      if (sec.title) lines.push(sec.title);
      if (sec.content) lines.push(sec.content);
      lines.push("");
    });
    if (typeof d.content === "string" && d.content) lines.push(d.content);
    return lines.join("\n").trim();
  }
  if (typeof d.content === "string" && d.content) {
    lines.push(d.content);
    return lines.join("\n");
  }
  if (Array.isArray(d.fields) && d.fields.length > 0) {
    (d.fields as Array<{ label: string; value: string }>).forEach((f) =>
      lines.push(`${f.label}: ${f.value}`)
    );
    if (typeof d.content === "string" && d.content)
      lines.push("", "Justificativa:", d.content);
    return lines.join("\n");
  }
  if (d.mainCondition || d.cid) {
    if (d.mainCondition) lines.push(`Condição principal: ${d.mainCondition}`);
    if (d.cid) lines.push(`CID: ${d.cid}`);
    if (d.confidence) lines.push(`Confiança: ${d.confidence}`);
    if (d.severity) lines.push(`Severidade: ${d.severity}`);
    if (d.evolution) lines.push(`Evolução: ${d.evolution}`);
    if (d.justification) lines.push("", "Justificativa:", String(d.justification));
    if (d.content) lines.push("", "Justificativa:", String(d.content));
    return lines.join("\n");
  }
  if (Array.isArray(d.familyHistory) && d.familyHistory.length > 0) {
    (d.familyHistory as Array<{ relation: string; condition: string; age: string }>).forEach(
      (item) => lines.push(`• ${item.relation}: ${item.condition} (idade: ${item.age})`)
    );
    return lines.join("\n");
  }
  if (Array.isArray(d.chronicConditions) && d.chronicConditions.length > 0) {
    (d.chronicConditions as Array<{ name: string; since: string; status: string }>).forEach(
      (item) => lines.push(`• ${item.name} | desde: ${item.since} | ${item.status}`)
    );
    return lines.join("\n");
  }
  if (Array.isArray(d.history) && d.history.length > 0) {
    (d.history as Array<{ date: string; type: string; doctor: string; specialty: string; note: string }>).forEach(
      (item) => {
        lines.push(`• ${item.date} | ${item.type} | ${item.doctor} (${item.specialty})`);
        if (item.note) lines.push(`  ${item.note}`);
      }
    );
    return lines.join("\n");
  }
  if (Array.isArray(d.certificates) && d.certificates.length > 0) {
    (d.certificates as Array<{ date: string; type: string; description: string; period: string }>).forEach(
      (item) =>
        lines.push(`• ${item.type} | ${item.date} | ${item.period}\n  ${item.description}`)
    );
    return lines.join("\n");
  }
  if (Array.isArray(d.items) && d.items.length > 0) {
    (d.items as Array<{ primary?: string; secondary?: string; metadata?: Array<{ label: string; value: string }> }>).forEach(
      (item) => {
        const primary = item.primary ?? "";
        const secondary = item.secondary ?? "";
        const meta = item.metadata?.map((m) => `${m.label}: ${m.value}`).join(" | ") ?? "";
        lines.push(
          `• ${primary}${secondary ? ` - ${secondary}` : ""}${meta ? ` (${meta})` : ""}`
        );
      }
    );
    return lines.join("\n");
  }
  const legacyArrays: Record<string, string> = {
    symptoms_card: "symptoms",
    allergies_card: "allergies",
    medications_card: "medications",
    differential_diagnosis_card: "differentials",
    suggested_exams_card: "suggestedExams",
  };
  const key = legacyArrays[component.type];
  if (key && Array.isArray(d[key])) {
    const arr = d[key] as Array<Record<string, string>>;
    arr.forEach((item) => {
      const name = item.name ?? item.primary ?? "";
      const extra = [item.frequency, item.reaction, item.severity, item.probability]
        .filter(Boolean)
        .join(" | ");
      lines.push(extra ? `• ${name} (${extra})` : `• ${name}`);
    });
    return lines.join("\n");
  }
  if (Array.isArray(d.prescriptions) && d.prescriptions.length > 0) {
    (d.prescriptions as Array<{ type?: string; date?: string; items?: Array<{ name: string; dosage: string; frequency: string; duration: string }> }>).forEach(
      (p) => {
        lines.push(`${p.type ?? "Receita"}${p.date ? ` - ${p.date}` : ""}`);
        p.items?.forEach((i) =>
          lines.push(`  • ${i.name} | ${i.dosage} | ${i.frequency} | ${i.duration}`)
        );
        lines.push("");
      }
    );
    return lines.join("\n").trim();
  }
  if (Array.isArray(d.appointments) && d.appointments.length > 0) {
    (d.appointments as Array<{ date: string; time?: string; type?: string; doctor?: string; notes?: string }>).forEach(
      (a) => {
        lines.push(
          `• ${a.date}${a.time ? ` ${a.time}` : ""} | ${a.type ?? ""}${a.doctor ? ` | ${a.doctor}` : ""}`
        );
        if (a.notes) lines.push(`  ${a.notes}`);
      }
    );
    return lines.join("\n");
  }
  const personal = (d.personal ?? d.socialHistory) as Record<string, string> | undefined;
  if (personal && typeof personal === "object") {
    Object.entries(personal).forEach(([k, v]) => {
      if (v) lines.push(`${k}: ${v}`);
    });
    return lines.join("\n");
  }
  if (typeof d.content === "string" && d.content) {
    lines.push(d.content);
    return lines.join("\n");
  }
  return lines.slice(0, 1).join("\n");
}

function CardWithActions({
  component,
  sectionIndex,
  componentIndex,
  showCardActions,
  onUpdateComponent,
  onEditStart,
  onEditEnd,
  children,
}: {
  component: AIComponent;
  sectionIndex: number;
  componentIndex: number;
  showCardActions: boolean;
  onUpdateComponent?: (sectionIndex: number, componentIndex: number, updated: AIComponent) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!children) return null;
  if (!showCardActions) return <>{children}</>;

  const handleCopy = async () => {
    const text = getComponentCopyText(component);
    await navigator.clipboard.writeText(text);
    toast.success("Conteúdo copiado para a área de transferência!");
  };

  const handleStartEdit = () => {
    onEditStart?.();
    setIsEditing(true);
  };

  const handleSaveFromForm = (updated: AIComponent) => {
    onUpdateComponent?.(sectionIndex, componentIndex, updated);
    onEditEnd?.();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    onEditEnd?.();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex w-full flex-col gap-2">
        <CardEditForm
          component={component}
          onSave={handleSaveFromForm}
          onCancel={handleCancelEdit}
          onCopy={handleCopy}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-start gap-2 w-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          {children}
        </div>
        <button
          type="button"
          onClick={handleStartEdit}
          className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 self-end">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-100"
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar
        </button>
      </div>
    </div>
  );
}

// ─── Lógica do Grid ──────────────────────────────────────────────────────────

/**
 * Determina a "classe de tamanho" de um componente:
 * - "full"    → ocupa linha inteira (renderizado separadamente)
 * - "wide"    → precisa de bastante espaço (min ~360px)
 * - "compact" → funciona bem em colunas menores (min ~280px)
 */
function getComponentSize(type: string): "full" | "wide" | "compact" {
  if (FULL_WIDTH_COMPONENTS.includes(type)) return "full";
  if (WIDE_COMPONENTS.includes(type)) return "wide";
  return "compact";
}

export function SectionRenderer({
  section,
  sectionIndex = 0,
  showCardActions = false,
  clientId,
  recordingId,
  onUpdateComponent,
  onEditStart,
  onEditEnd,
}: SectionRendererProps) {
  if (
    !section.components ||
    !Array.isArray(section.components) ||
    section.components.length === 0
  ) {
    return null;
  }

  // Filtrar componentes sem dados válidos
  const validComponents = section.components.filter((c) => hasValidComponentData(c));
  if (validComponents.length === 0) return null;

  // Separar full-width dos que vão para o grid
  const fullWidthComponents = validComponents.filter(
    (c) => getComponentSize(c.type) === "full"
  );
  const gridComponents = validComponents.filter(
    (c) => getComponentSize(c.type) !== "full"
  );

  // Definir colunas e tamanho mínimo baseado na composição do grid
  const wideCount = gridComponents.filter((c) => getComponentSize(c.type) === "wide").length;
  const total = gridComponents.length;

  // Estratégia de colunas:
  // - 1 item: sem grid (auto-sizing)
  // - Apenas compactos: até 3 colunas com min 260px
  // - Mix ou wide: até 2 colunas com min 340px
  let gridStyle: React.CSSProperties = {};
  let gridGap = "gap-5";

  if (total === 0) {
    // nada
  } else if (total === 1) {
    gridStyle = { display: "block" };
  } else if (wideCount === 0) {
    // Apenas compactos — pode ter até 3 colunas
    const maxCols = total >= 3 ? 3 : 2;
    gridStyle = {
      display: "grid",
      gridTemplateColumns: `repeat(${maxCols}, minmax(min(100%, 260px), 1fr))`,
    };
    gridGap = total >= 6 ? "gap-4" : "gap-5";
  } else {
    // Há componentes "wide" — máx 2 colunas
    gridStyle = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    };
    gridGap = "gap-5";
  }

  // Gerar título da seção
  const getSectionTitle = (): string => {
    if (section.title && section.title.trim().length > 0) return section.title;
    if (validComponents.length === 1) {
      const t = validComponents[0]?.title;
      if (t && t.trim()) return t;
    }
    const first = validComponents.find((c) => c.title && c.title.trim())?.title;
    if (first) return first;
    return `Seção ${sectionIndex + 1}`;
  };

  const sectionTitle = getSectionTitle();

  return (
    <section className="mb-10 w-full overflow-x-hidden">
      {/* Header da seção */}
      <div className="mb-6 flex items-start justify-between gap-2 border-b border-gray-100 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-gray-900 break-words">{sectionTitle}</h2>
          {section.description && (
            <p className="mt-1 text-sm text-gray-500 break-words">{section.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Componentes full-width — empilhados verticalmente */}
        {fullWidthComponents.length > 0 && (
          <div className="flex flex-col gap-6">
            {fullWidthComponents.map((component, idx) => (
              <CardWithActions
                key={`full-${idx}`}
                component={component}
                sectionIndex={sectionIndex}
                componentIndex={validComponents.indexOf(component)}
                showCardActions={showCardActions}
                onUpdateComponent={onUpdateComponent}
                onEditStart={onEditStart}
                onEditEnd={onEditEnd}
              >
                <ComponentRenderer component={component} />
              </CardWithActions>
            ))}
          </div>
        )}

        {/* Grid responsivo para os demais componentes */}
        {gridComponents.length > 0 && (
          <div
            className={`w-full ${gridGap}`}
            style={gridStyle}
          >
            {gridComponents.map((component, idx) => (
              <div
                key={`grid-${idx}`}
                className="min-w-0 h-full"
              >
                <CardWithActions
                  component={component}
                  sectionIndex={sectionIndex}
                  componentIndex={validComponents.indexOf(component)}
                  showCardActions={showCardActions}
                  onUpdateComponent={onUpdateComponent}
                  onEditStart={onEditStart}
                  onEditEnd={onEditEnd}
                >
                  <ComponentRenderer component={component} />
                </CardWithActions>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
