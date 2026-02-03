import type { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { generateMedicalRecordPdf, generateOverviewPdf } from "./pdfOverviewGenerator";

const MEDICAL_RECORD_CONTENT_ID = "medical-record-content";
export const OVERVIEW_CONTENT_ID = "overview-content";

/**
 * Remove todos os botões do clone (Editar, Copiar, Salvar, Cancelar)
 * para o PDF exportar apenas o conteúdo do prontuário.
 */
function removeButtonsFromClone(clone: HTMLElement): void {
  clone.querySelectorAll("button").forEach((btn) => btn.remove());
}

const PDF_CLONE_ID = "medical-record-pdf-clone";

/**
 * Remove classes do Tailwind que aplicam sombra ou ring (ex: shadow-sm, ring-1)
 * para que o PDF não tenha sombras vindas de classes.
 */
function stripShadowAndRingClasses(clone: HTMLElement): void {
  const all = clone.querySelectorAll("*");
  const elements = [clone, ...Array.from(all)];
  elements.forEach((el) => {
    if (
      el instanceof HTMLElement &&
      el.className &&
      typeof el.className === "string"
    ) {
      const classes = el.className
        .split(/\s+/)
        .filter(
          (c) =>
            !/^shadow-|^ring-|shadow$|ring$/.test(c) &&
            !c.includes("shadow") &&
            !c.includes("ring-"),
        );
      el.className = classes.join(" ").trim();
    }
  });
}

/**
 * Remove TODAS as sombras do clone: remove classes de shadow/ring e injeta
 * CSS com !important escopado só ao clone.
 */
function removeShadowsFromClone(clone: HTMLElement): void {
  stripShadowAndRingClasses(clone);

  clone.id = PDF_CLONE_ID;

  const style = document.createElement("style");
  style.textContent = `
    #${PDF_CLONE_ID}, #${PDF_CLONE_ID} *, #${PDF_CLONE_ID} *::before, #${PDF_CLONE_ID} *::after {
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
      text-shadow: none !important;
      -webkit-text-shadow: none !important;
      filter: none !important;
      -webkit-filter: none !important;
      --tw-ring-shadow: 0 0 #0000 !important;
      --tw-shadow: 0 0 #0000 !important;
      --tw-shadow-colored: 0 0 #0000 !important;
    }
  `;
  clone.insertBefore(style, clone.firstChild);

  const all = clone.querySelectorAll("*");
  const elements = [clone, ...Array.from(all)];
  elements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.setProperty("box-shadow", "none", "important");
      el.style.setProperty("-webkit-box-shadow", "none", "important");
      el.style.setProperty("text-shadow", "none", "important");
      el.style.setProperty("-webkit-text-shadow", "none", "important");
      el.style.setProperty("filter", "none", "important");
      el.style.setProperty("-webkit-filter", "none", "important");
    }
  });
}

/**
 * Exporta o HTML de um elemento (sem botões de edição) para PDF.
 * @param elementId - id do elemento no DOM
 * @param defaultFilename - nome padrão do arquivo (ex: "prontuario" ou "resumo-geral")
 */
async function exportContentToPdf(
  elementId: string,
  defaultFilename: string,
  filename?: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Conteúdo não encontrado (id: ${elementId}).`);
  }

  const clone = element.cloneNode(true) as HTMLElement;
  removeButtonsFromClone(clone);
  removeShadowsFromClone(clone);

  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.width = `${element.offsetWidth}px`;
  clone.style.backgroundColor = "#ffffff";
  clone.style.zIndex = "-1";
  clone.style.visibility = "visible";
  clone.style.pointerEvents = "none";
  clone.style.padding = "20px";
  document.body.appendChild(clone);

  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      imageTimeout: 0,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png", 1.0);

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const name =
      filename ??
      `${defaultFilename}-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(name);
  } finally {
    clone.remove();
  }
}

/**
 * Exporta o prontuário médico para PDF.
 * Se `medicalRecordData` for passado, usa geração programática (jsPDF + autoTable, estilo Legisai):
 * sem sombras, arquivo leve e quebras de página sem cortar cards.
 * Caso contrário, usa html2canvas no DOM (comportamento anterior).
 */
export async function exportMedicalRecordToPdf(
  medicalRecordData?: AIComponentResponse | null,
  filename?: string,
): Promise<void> {
  if (
    medicalRecordData?.sections &&
    Array.isArray(medicalRecordData.sections) &&
    medicalRecordData.sections.length > 0
  ) {
    generateMedicalRecordPdf(medicalRecordData, filename);
    return;
  }
  return exportContentToPdf(MEDICAL_RECORD_CONTENT_ID, "prontuario", filename);
}

/**
 * Exporta o resumo geral (overview) para PDF.
 * Se `overviewData` for passado, usa geração programática (jsPDF + autoTable, estilo Legisai):
 * sem sombras, arquivo leve e quebras de página sem cortar cards.
 * Caso contrário, usa html2canvas no DOM (comportamento anterior).
 */
export async function exportOverviewToPdf(
  overviewData?: AIComponentResponse | null,
  filename?: string,
): Promise<void> {
  if (
    overviewData?.sections &&
    Array.isArray(overviewData.sections) &&
    overviewData.sections.length > 0
  ) {
    generateOverviewPdf(overviewData, filename);
    return;
  }
  return exportContentToPdf(OVERVIEW_CONTENT_ID, "resumo-geral", filename);
}
