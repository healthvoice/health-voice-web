import type { AIComponent, AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 14;
const PAGE_WIDTH = 210;
const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const Y_PAGE_BREAK = 250;
const Y_PAGE_BREAK_TEXT = 270;
const NEW_PAGE_TOP = 20;

type TableContent = { head: string[]; body: string[][] };
type TextContent = string[];

/**
 * Converte dados do componente para conteúdo de tabela (head + body) quando fizer sentido.
 */
function getComponentTable(component: AIComponent): TableContent | null {
  const d = (component.data ?? {}) as Record<string, unknown>;

  // Campos label/value (biometrics, main_diagnosis, social_history, etc.)
  if (Array.isArray(d.fields) && d.fields.length > 0) {
    const fields = d.fields as Array<{ label: string; value: string }>;
    return {
      head: ["Campo", "Valor"],
      body: fields.map((f) => [f.label || "-", f.value ?? "-"]),
    };
  }

  // Items genéricos (symptoms, exams, referrals, medications, etc.)
  if (Array.isArray(d.items) && d.items.length > 0) {
    const items = d.items as Array<{
      primary?: string;
      secondary?: string;
      metadata?: Array<{ label: string; value: string }>;
      name?: string;
    }>;
    const body = items.map((item) => {
      const primary = item.primary ?? item.name ?? "-";
      const secondary = item.secondary ?? "";
      const meta =
        item.metadata?.map((m) => `${m.label}: ${m.value}`).join(" | ") ?? "";
      const details = [secondary, meta].filter(Boolean).join(" — ") || "-";
      return [primary, details];
    });
    return { head: ["Item", "Detalhes"], body };
  }

  // Listas simples (orientations, riskFactors)
  if (Array.isArray(d.orientations) && d.orientations.length > 0) {
    return {
      head: ["Orientações"],
      body: (d.orientations as string[]).map((o) => [o]),
    };
  }
  if (Array.isArray(d.riskFactors) && d.riskFactors.length > 0) {
    return {
      head: ["Fator de risco"],
      body: (d.riskFactors as string[]).map((r) => [r]),
    };
  }

  // Family history
  if (Array.isArray(d.familyHistory) && d.familyHistory.length > 0) {
    const arr = d.familyHistory as Array<{
      relation: string;
      condition: string;
      age: string;
    }>;
    return {
      head: ["Parente", "Condição", "Idade"],
      body: arr.map((item) => [
        item.relation ?? "-",
        item.condition ?? "-",
        item.age ?? "-",
      ]),
    };
  }

  // Chronic conditions
  if (Array.isArray(d.chronicConditions) && d.chronicConditions.length > 0) {
    const arr = d.chronicConditions as Array<{
      name: string;
      since: string;
      status: string;
    }>;
    return {
      head: ["Condição", "Desde", "Status"],
      body: arr.map((item) => [
        item.name ?? "-",
        item.since ?? "-",
        item.status ?? "-",
      ]),
    };
  }

  // Certificates
  if (Array.isArray(d.certificates) && d.certificates.length > 0) {
    const arr = d.certificates as Array<{
      date: string;
      type: string;
      description: string;
      period: string;
    }>;
    return {
      head: ["Tipo", "Data", "Período", "Descrição"],
      body: arr.map((item) => [
        item.type ?? "-",
        item.date ?? "-",
        item.period ?? "-",
        item.description ?? "-",
      ]),
    };
  }

  // Legado: symptoms, allergies, medications, differentials, suggestedExams
  const legacyKeys: Record<string, string> = {
    symptoms_card: "symptoms",
    allergies_card: "allergies",
    medications_card: "medications",
    differential_diagnosis_card: "differentials",
    suggested_exams_card: "suggestedExams",
  };
  const key = legacyKeys[component.type];
  if (key && Array.isArray(d[key])) {
    const arr = d[key] as Array<Record<string, string>>;
    const body = arr.map((item) => {
      const name = item.name ?? item.primary ?? "-";
      const extra = [
        item.frequency,
        item.reaction,
        item.severity,
        item.probability,
      ]
        .filter(Boolean)
        .join(" | ");
      return [name, extra || "-"];
    });
    return { head: ["Item", "Detalhes"], body };
  }

  // Next appointments (legado)
  if (Array.isArray(d.appointments) && d.appointments.length > 0) {
    const arr = d.appointments as Array<{
      date: string;
      time?: string;
      type?: string;
      doctor?: string;
      notes?: string;
    }>;
    return {
      head: ["Data", "Horário", "Tipo", "Médico", "Observações"],
      body: arr.map((a) => [
        a.date ?? "-",
        a.time ?? "-",
        a.type ?? "-",
        a.doctor ?? "-",
        a.notes ?? "-",
      ]),
    };
  }

  return null;
}

/**
 * Converte componente em linhas de texto (para blocos longos ou fallback).
 */
function getComponentTextLines(component: AIComponent): TextContent {
  const d = (component.data ?? {}) as Record<string, unknown>;
  const lines: string[] = []; // título já é impresso separadamente

  if (typeof d.observations === "string" && d.observations) {
    lines.push(d.observations);
    return lines;
  }

  if (typeof d.content === "string" && d.content) {
    lines.push(d.content);
    return lines;
  }

  if (Array.isArray(d.sections) && d.sections.length > 0) {
    (d.sections as Array<{ title?: string; content: string }>).forEach(
      (sec) => {
        if (sec.title) lines.push(sec.title);
        if (sec.content) lines.push(sec.content);
      },
    );
    return lines;
  }

  // Main diagnosis legado
  if (d.mainCondition || d.cid || d.justification) {
    if (d.mainCondition) lines.push(`Condição principal: ${d.mainCondition}`);
    if (d.cid) lines.push(`CID: ${d.cid}`);
    if (d.justification) lines.push(String(d.justification));
    return lines;
  }

  // Treatment plan
  if (d.treatment && typeof d.treatment === "object") {
    const t = d.treatment as {
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
      }>;
      lifestyle?: string[];
    };
    if (Array.isArray(t.medications)) {
      t.medications.forEach((m) =>
        lines.push(
          `• ${m.name} | ${m.dosage} | ${m.frequency} | ${m.duration}`,
        ),
      );
    }
    if (Array.isArray(t.lifestyle)) {
      t.lifestyle.forEach((l) => lines.push(`• ${l}`));
    }
    return lines;
  }

  // Medical history timeline
  if (Array.isArray(d.history) && d.history.length > 0) {
    (
      d.history as Array<{
        date: string;
        type: string;
        doctor: string;
        specialty: string;
        note: string;
      }>
    ).forEach((item) => {
      lines.push(
        `${item.date} | ${item.type} | ${item.doctor} (${item.specialty})`,
      );
      if (item.note) lines.push(`  ${item.note}`);
    });
    return lines;
  }

  // Prescriptions legado
  if (Array.isArray(d.prescriptions) && d.prescriptions.length > 0) {
    (
      d.prescriptions as Array<{
        type?: string;
        date?: string;
        items?: Array<{
          name: string;
          dosage: string;
          frequency: string;
          duration: string;
        }>;
      }>
    ).forEach((p) => {
      lines.push(`${p.type ?? "Receita"}${p.date ? ` - ${p.date}` : ""}`);
      p.items?.forEach((i) =>
        lines.push(
          `  • ${i.name} | ${i.dosage} | ${i.frequency} | ${i.duration}`,
        ),
      );
    });
    return lines;
  }

  // Personal / socialHistory (legado)
  const personal = (d.personal ?? d.socialHistory) as
    | Record<string, string>
    | undefined;
  if (personal && typeof personal === "object") {
    Object.entries(personal).forEach(([k, v]) => {
      if (v) lines.push(`${k}: ${v}`);
    });
    return lines;
  }

  return lines;
}

interface PdfBuildOptions {
  defaultTitle: string;
}

/**
 * Desenha o conteúdo do PDF (cabeçalho + seções/cards) no documento jsPDF.
 * Usado tanto pelo resumo geral (overview) quanto pelo prontuário médico.
 */
function buildPdfContent(
  doc: jsPDF,
  data: AIComponentResponse,
  options: PdfBuildOptions,
): void {
  doc.setFontSize(22);
  doc.setTextColor(26, 29, 31);
  doc.text(data.pageTitle || options.defaultTitle, MARGIN, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    MARGIN,
    26,
  );

  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30);

  let currentY = 40;

  if (!data.sections || data.sections.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text("Nenhuma seção disponível.", MARGIN, currentY);
    return;
  }

  for (const section of data.sections) {
    if (currentY > Y_PAGE_BREAK) {
      doc.addPage();
      currentY = NEW_PAGE_TOP;
    }

    doc.setFontSize(16);
    doc.setTextColor(26, 29, 31);
    doc.text(section.title || "Seção", MARGIN, currentY);
    currentY += 10;

    if (section.description) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      const descLines = doc.splitTextToSize(
        section.description,
        MAX_TEXT_WIDTH,
      );
      descLines.forEach((line: string) => {
        if (currentY > Y_PAGE_BREAK_TEXT) {
          doc.addPage();
          currentY = NEW_PAGE_TOP;
        }
        doc.text(line, MARGIN, currentY);
        currentY += 5;
      });
      currentY += 4;
    }

    const components = section.components ?? [];
    for (const component of components) {
      if (currentY > Y_PAGE_BREAK) {
        doc.addPage();
        currentY = NEW_PAGE_TOP;
      }

      doc.setFontSize(12);
      doc.setTextColor(40, 44, 52);
      doc.text(component.title || "Card", MARGIN, currentY);
      currentY += 7;

      const table = getComponentTable(component);
      if (table && table.body.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [table.head],
          body: table.body,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: MARGIN, right: MARGIN },
          styles: { fontSize: 9, cellPadding: 2 },
        });
        currentY = (doc as unknown as { lastAutoTable: { finalY: number } })
          .lastAutoTable.finalY + 10;
        continue;
      }

      const textLines = getComponentTextLines(component);
      if (textLines.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(0);
        for (const raw of textLines) {
          const wrapped = doc.splitTextToSize(raw, MAX_TEXT_WIDTH);
          for (const line of wrapped) {
            if (currentY > Y_PAGE_BREAK_TEXT) {
              doc.addPage();
              currentY = NEW_PAGE_TOP;
            }
            doc.text(line, MARGIN, currentY);
            currentY += 5;
          }
          currentY += 2;
        }
        currentY += 6;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text("Sem conteúdo.", MARGIN, currentY);
        currentY += 10;
      }
    }

    currentY += 8;
  }
}

/**
 * Gera o PDF do resumo geral (overview) a partir dos dados estruturados.
 * Estratégia igual ao Legisai: jsPDF + autoTable, sem html2canvas.
 * - Sem sombras (conteúdo vetorial/texto).
 * - Arquivo leve (sem imagem PNG).
 * - Quebras de página controladas (não corta cards no meio).
 */
export function generateOverviewPdf(
  data: AIComponentResponse,
  filename?: string,
): void {
  const doc = new jsPDF("p", "mm", "a4");
  buildPdfContent(doc, data, { defaultTitle: "Insights" });
  const name =
    filename ??
    `insights-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(name);
}
