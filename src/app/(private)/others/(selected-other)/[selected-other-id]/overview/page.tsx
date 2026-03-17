"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { FileDown, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Overview, type OverviewHandle } from "../components/overview";
import { exportOverviewToPdf } from "../utils/export-overview-pdf";

export default function OverviewPage() {
  const { selectedRecording } = useGeneralContext();
  const [isExporting, setIsExporting] = useState(false);
  const [editingCount, setEditingCount] = useState(0);
  const overviewRef = useRef<OverviewHandle | null>(null);

  const hasStructuredSummary = !!selectedRecording?.structuredSummary;

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
    <div className="flex w-full flex-col gap-6">
      {/* Header — sempre visível, mesmo padrão da Transcrição */}
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-gray-500">
            Insights estruturado da gravação com componentes gerados pela IA.
          </p>
        </div>
        {hasStructuredSummary && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50 active:scale-95"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {isExporting ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>
        )}
      </div>
      {/* Card — mesmo padrão da Transcrição (sempre visível) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full max-w-none p-6">
          <Overview
            ref={overviewRef}
            onEditStart={handleEditStart}
            onEditEnd={handleEditEnd}
          />
        </div>
      </div>
      {hasStructuredSummary && (
        <div className="flex w-full justify-end border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
