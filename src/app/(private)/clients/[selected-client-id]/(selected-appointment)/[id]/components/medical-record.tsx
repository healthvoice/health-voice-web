"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { useGeneralContext } from "@/context/GeneralContext";
import { useApiContext } from "@/context/ApiContext";
import { DynamicComponentRenderer } from "@/app/(private)/ai-components-preview/components/DynamicComponentRenderer";
import type { AIComponentResponse } from "@/app/(private)/ai-components-preview/types/component-types";
import { convertToAIComponentResponse } from "../utils/summary-converter";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export interface MedicalRecordHandle {
  getResponse: () => AIComponentResponse | null;
}

interface MedicalRecordProps {
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const MedicalRecord = forwardRef<MedicalRecordHandle, MedicalRecordProps>(function MedicalRecord({ onEditStart, onEditEnd }, ref) {
  const { selectedRecording, selectedClient, setSelectedRecording } =
    useGeneralContext();
  const { PutAPI } = useApiContext();
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
          toast.success("Alterações salvas no prontuário.");
        } else {
          toast.error("Falha ao salvar. Tente novamente.");
        }
      } catch {
        toast.error("Falha ao salvar. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedRecording?.id, PutAPI, setSelectedRecording],
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
            Prontuário Médico não disponível
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Esta gravação ainda não possui um prontuário médico estruturado
            gerado pela IA.
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
