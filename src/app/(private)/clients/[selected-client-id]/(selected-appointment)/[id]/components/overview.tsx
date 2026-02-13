"use client";

import { DynamicComponentRenderer } from "@/app/(private)/ai-components-preview/components/core/DynamicComponentRenderer";
import type { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { handleApiError } from "@/utils/error-handler";
import { Loader2 } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { OVERVIEW_CONTENT_ID } from "../utils/export-medical-record-pdf";
import { convertToAIComponentResponse } from "../utils/summary-converter";

export interface OverviewHandle {
  getResponse: () => AIComponentResponse | null;
}

interface OverviewProps {
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const Overview = forwardRef<OverviewHandle, OverviewProps>(function Overview({ onEditStart, onEditEnd }, ref) {
  const { selectedRecording, selectedClient, setSelectedRecording } =
    useGeneralContext();
  const { PutAPI, PostAPI } = useApiContext();
  const [response, setResponse] = useState<AIComponentResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const responseRef = useRef<AIComponentResponse | null>(null);

  const initialSummary = useMemo(
    () =>
      selectedRecording
        ? convertToAIComponentResponse(selectedRecording.structuredSummary)
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
      selectedRecording.structuredSummary,
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
      const prevComponent = prev.sections[sectionIndex]?.components[componentIndex];
      const hasChanges = JSON.stringify(prevComponent) !== JSON.stringify(updated);
      
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
          { structuredSummary: next },
          true,
        );
        if (status >= 200 && status < 300) {
          setSelectedRecording((prevRec) =>
            prevRec ? { ...prevRec, structuredSummary: next } : prevRec,
          );
          // Tracking de edição de resumo - apenas se houver alterações reais
          if (hasChanges && selectedRecording?.id) {
            trackAction(
              {
                actionType: UserActionType.SUMMARY_EDITED,
                recordingId: selectedRecording.id,
                metadata: {
                  screen: 'overview',
                  screenName: 'Insights',
                },
              },
              PostAPI
            ).catch((error) => {
              console.warn('Erro ao registrar tracking de edição:', error);
            });
          }
          toast.success("Alterações salvas no resumo.");
        } else {
          const errorMessage = handleApiError(
            { status, body: {} },
            "Falha ao salvar. Tente novamente.",
          );
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error("Erro ao salvar resumo:", error);
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
      <div className="flex w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-12">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Resumo Estruturado não disponível
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Esta gravação ainda não possui um resumo estruturado gerado pela IA.
            {selectedRecording.summary && (
              <span className="mt-4 block">
                Você pode visualizar o resumo em texto na aba "Geral".
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={OVERVIEW_CONTENT_ID}
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
