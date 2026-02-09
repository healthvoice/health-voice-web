"use client";

import { FileDown, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Overview, type OverviewHandle } from "../components/overview";
import { exportOverviewToPdf } from "../utils/export-medical-record-pdf";
import { PersonalizationModal } from "../components/personalization-modal";

export default function OverviewPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingCount, setEditingCount] = useState(0);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const overviewRef = useRef<OverviewHandle | null>(null);

  // Abrir modal quando entrar na página (apenas uma vez)
  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("hasSeenPersonalizationModal-resumo");
    if (!hasSeenModal) {
      setIsPersonalizationModalOpen(true);
      sessionStorage.setItem("hasSeenPersonalizationModal-resumo", "true");
    }
  }, []);

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
      const data = overviewRef.current?.getResponse() ?? null;
      await exportOverviewToPdf(data);
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
            Resumo Geral
          </h1>
          <p className="text-sm break-words text-gray-500">
            Resumo estruturado da consulta com componentes gerados pela IA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPersonalizationModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
          >
            <Sparkles className="h-4 w-4" />
            Personalizar Resumo
          </button>
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
      <div className="min-w-0 overflow-x-hidden">
        <Overview
          ref={overviewRef}
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

      <PersonalizationModal
        isOpen={isPersonalizationModalOpen}
        onClose={() => setIsPersonalizationModalOpen(false)}
        type="resumo"
      />
    </div>
  );
}
