"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MedicalRecord, type MedicalRecordHandle } from "../components/medical-record";
import { exportMedicalRecordToPdf } from "../utils/export-medical-record-pdf";

export default function MedicalRecordPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingCount, setEditingCount] = useState(0);
  const medicalRecordRef = useRef<MedicalRecordHandle | null>(null);

  const handleEditStart = useCallback(() => setEditingCount((c) => c + 1), []);
  const handleEditEnd = useCallback(
    () => setEditingCount((c) => Math.max(0, c - 1)),
    [],
  );

  const handleExportPdf = async () => {
    if (editingCount > 0) {
      toast.error(
        "Salve ou cancele as edições em andamento antes de exportar o PDF.",
      );
      return;
    }
    setIsExporting(true);
    try {
      const data = medicalRecordRef.current?.getResponse() ?? null;
      await exportMedicalRecordToPdf(data);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao exportar PDF.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-6 overflow-x-hidden">
      <div className="flex w-full min-w-0 items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words text-gray-900">
            Prontuário Médico
          </h1>
          <p className="text-sm break-words text-gray-500">
            Resumo específico com pontos de atenção e informações críticas
            gerados pela IA.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isExporting ? "Exportando..." : "Exportar em PDF"}
        </button>
      </div>
      <div className="min-w-0 overflow-x-hidden">
        <MedicalRecord
          ref={medicalRecordRef}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
        />
      </div>
      <div className="flex w-full justify-end border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isExporting ? "Exportando..." : "Exportar em PDF"}
        </button>
      </div>
    </div>
  );
}
