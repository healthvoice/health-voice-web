"use client";

import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { FileDown, Loader2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Overview, type OverviewHandle } from "../components/overview";
import { PersonalizationModal } from "../components/personalization-modal";
import { exportOverviewToPdf } from "../utils/export-medical-record-pdf";

export default function OverviewPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingCount, setEditingCount] = useState(0);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] =
    useState(false);
  const overviewRef = useRef<OverviewHandle | null>(null);
  const pathname = usePathname();
  const { PostAPI } = useApiContext();
  const { selectedRecording, selectedClient } = useGeneralContext();

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem(
      "hasSeenPersonalizationModal-resumo",
    );
    if (!hasSeenModal) {
      setIsPersonalizationModalOpen(true);
      sessionStorage.setItem("hasSeenPersonalizationModal-resumo", "true");
    }
  }, []);

  useEffect(() => {
    if (selectedRecording?.id) {
      trackAction(
        {
          actionType: UserActionType.SCREEN_VIEWED,
          recordingId: selectedRecording.id,
          metadata: {
            screen: "overview",
            screenName: "Insights",
            recordingId: selectedRecording.id,
          },
        },
        PostAPI,
      ).catch((err: { status?: number; body?: unknown }) => {
        console.warn(
          "[Tracking] Falha ao registrar Overview:",
          err?.status ?? err,
          err?.body ?? err,
        );
      });
    }
  }, [selectedRecording?.id, PostAPI, pathname]);

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
      if (selectedRecording?.id) {
        trackAction(
          {
            actionType: UserActionType.PDF_EXPORTED,
            recordingId: selectedRecording.id,
            metadata: {
              type: "overview",
              patientName: selectedClient?.name || undefined,
              recordingId: selectedRecording.id,
            },
          },
          PostAPI,
        ).catch((error) => {
          console.warn("Erro ao registrar tracking de PDF:", error);
        });
      }
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao exportar PDF.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const hasStructuredSummary = !!selectedRecording?.structuredSummary;

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-5 overflow-x-hidden">
      {/* Action bar — só exibe quando há resumo estruturado */}
      {hasStructuredSummary && (
        <div className="flex w-full min-w-0 items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsPersonalizationModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:shadow-md active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            Personalizar
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50 active:scale-95"
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

      {/* Content */}
      <div className="min-w-0 overflow-x-hidden">
        <Overview
          ref={overviewRef}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
        />
      </div>

      {/* Bottom export — só exibe quando há resumo estruturado */}
      {hasStructuredSummary && (
        <div className="flex w-full justify-end border-t border-gray-100 pt-5">
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

      <PersonalizationModal
        isOpen={isPersonalizationModalOpen}
        onClose={() => setIsPersonalizationModalOpen(false)}
        type="resumo"
      />
    </div>
  );
}
