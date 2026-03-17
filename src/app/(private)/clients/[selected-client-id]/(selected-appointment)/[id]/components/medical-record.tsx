"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useGeneralContext } from "@/context/GeneralContext";
import { useApiContext } from "@/context/ApiContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { handleApiError } from "@/utils/error-handler";
import { DynamicComponentRenderer } from "@/app/(private)/ai-components-preview/components/core/DynamicComponentRenderer";
import type { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";
import { convertToAIComponentResponse } from "../utils/summary-converter";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PendingRecordingEmptyState } from "@/components/pending-recording-empty-state";

export interface MedicalRecordHandle {
  getResponse: () => AIComponentResponse | null;
}

interface MedicalRecordProps {
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const MedicalRecord = forwardRef<
  MedicalRecordHandle,
  MedicalRecordProps
>(function MedicalRecord({ onEditStart, onEditEnd }, ref) {
  const { selectedRecording, selectedClient, setSelectedRecording } =
    useGeneralContext();
  const { PutAPI, PostAPI } = useApiContext();
  const [response, setResponse] = useState<AIComponentResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const responseRef = useRef<AIComponentResponse | null>(null);

  const initialSummary = useMemo(
    () =>
      selectedRecording
        ? convertToAIComponentResponse(selectedRecording.specificSummary)
        : null,
    [selectedRecording],
  );
  const currentResponse = response ?? initialSummary;
  responseRef.current = currentResponse ?? null;

  useImperativeHandle(
    ref,
    () => ({
      getResponse: () => responseRef.current,
    }),
    [],
  );

  useEffect(() => {
    if (!selectedRecording) return;
    const next = convertToAIComponentResponse(
      selectedRecording.specificSummary,
    );
    if (next) setResponse(next);
  }, [selectedRecording?.id]);

  const handleUpdateComponent = useCallback(
    async (
      sectionIndex: number,
      componentIndex: number,
      updated: import("@/app/(private)/ai-components-preview/types/component-types").AIComponent,
    ) => {
      if (!selectedRecording?.id) return;
      const prev = responseRef.current;
      if (!prev?.sections) return;

      // Verificar se houve alteração real comparando o componente anterior com o atual
      const prevComponent =
        prev.sections[sectionIndex]?.components[componentIndex];
      const hasChanges =
        JSON.stringify(prevComponent) !== JSON.stringify(updated);

      const next: AIComponentResponse = {
        pageTitle: prev.pageTitle ?? "",
        sections: prev.sections.map((section, si) =>
          si === sectionIndex
            ? {
                ...section,
                components: section.components.map((c, ci) =>
                  ci === componentIndex ? updated : c,
                ),
              }
            : section,
        ),
      };
      setResponse(next);
      setIsSaving(true);
      try {
        const { status } = await PutAPI(
          `/recording/${selectedRecording.id}`,
          { specificSummary: next },
          true,
        );
        if (status >= 200 && status < 300) {
          setSelectedRecording((prevRec) =>
            prevRec ? { ...prevRec, specificSummary: next } : prevRec,
          );
          // Tracking de edição de prontuário - apenas se houver alterações reais
          if (hasChanges && selectedRecording?.id) {
            trackAction(
              {
                actionType: UserActionType.SUMMARY_EDITED,
                recordingId: selectedRecording.id,
                metadata: {
                  screen: "medical-record",
                  screenName: "Prontuário Médico",
                },
              },
              PostAPI,
            ).catch((error) => {
              console.warn("Erro ao registrar tracking de edição:", error);
            });
          }
          toast.success("Alterações salvas no prontuário.");
        } else {
          const errorMessage = handleApiError(
            { status, body: {} },
            "Falha ao salvar. Tente novamente.",
          );
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error("Erro ao salvar prontuário:", error);
        toast.error("Falha ao salvar. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedRecording?.id, PutAPI, PostAPI, setSelectedRecording],
  );

  if (!selectedRecording) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Carregando gravação...</p>
        </div>
      </div>
    );
  }

  if (!initialSummary) {
    return (
      <PendingRecordingEmptyState
        variant="insights"
        isPrincipal={true}
        className="min-h-[340px] w-full"
      />
    );
  }

  return (
    <div
      id="medical-record-content"
      className="animate-in fade-in w-full duration-500"
    >
      <DynamicComponentRenderer
        response={currentResponse!}
        showCardActions
        clientId={selectedClient?.id}
        recordingId={selectedRecording.id}
        onUpdateComponent={handleUpdateComponent}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
      />
    </div>
  );
});
