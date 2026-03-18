"use client";

import { useSession } from "@/context/auth";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { FileDown, Loader2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  MedicalRecord,
  type MedicalRecordHandle,
} from "../components/medical-record";
import { PersonalizationModal } from "../components/personalization-modal";
import { exportMedicalRecordToPdf } from "../utils/export-medical-record-pdf";

export default function MedicalRecordPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [editingCount, setEditingCount] = useState(0);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] =
    useState(false);
  const medicalRecordRef = useRef<MedicalRecordHandle | null>(null);
  const pathname = usePathname();
  const { PostAPI } = useApiContext();
  const { selectedRecording, selectedClient } = useGeneralContext();
  const {
    isTrial,
    availableRecording,
    totalRecording,
    availabilityLoaded,
  } = useSession();

  const isExpired =
    !isTrial && availableRecording === 0 && totalRecording === 0;
  const shouldShowPersonalizationPrompt =
    availabilityLoaded && (isTrial || isExpired);

  // Abrir modal quando entrar na página (apenas uma vez), só para trial/expirado
  useEffect(() => {
    if (!shouldShowPersonalizationPrompt) return;
    const hasSeenModal = sessionStorage.getItem(
      "hasSeenPersonalizationModal-prontuario",
    );
    if (!hasSeenModal) {
      setIsPersonalizationModalOpen(true);
      sessionStorage.setItem("hasSeenPersonalizationModal-prontuario", "true");
    }
  }, [shouldShowPersonalizationPrompt]);

  // Tracking quando a página é visualizada (pathname garante disparo a cada acesso à tela)
  useEffect(() => {
    if (selectedRecording?.id) {
      console.log(
        "[Tracking] Disparando SCREEN_VIEWED: medical-record (Prontuário)",
      );
      trackAction(
        {
          actionType: UserActionType.SCREEN_VIEWED,
          recordingId: selectedRecording.id,
          metadata: {
            screen: "medical-record",
            screenName: "Prontuário Médico",
            recordingId: selectedRecording.id,
          },
        },
        PostAPI,
      ).catch((err: { status?: number; body?: unknown }) => {
        console.warn(
          "[Tracking] Falha ao registrar Prontuário:",
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
      const data = medicalRecordRef.current?.getResponse() ?? null;
      await exportMedicalRecordToPdf(data);
      // Tracking de exportação de PDF
      if (selectedRecording?.id) {
        trackAction(
          {
            actionType: UserActionType.PDF_EXPORTED,
            recordingId: selectedRecording.id,
            metadata: {
              type: "medical-record",
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
        <div className="flex items-center gap-3">
          {shouldShowPersonalizationPrompt && (
            <button
              type="button"
              onClick={() => setIsPersonalizationModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <Sparkles className="h-4 w-4" />
              Personalizar Prontuário
            </button>
          )}
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

      <PersonalizationModal
        isOpen={isPersonalizationModalOpen}
        onClose={() => setIsPersonalizationModalOpen(false)}
        type="prontuario"
      />
    </div>
  );
}
