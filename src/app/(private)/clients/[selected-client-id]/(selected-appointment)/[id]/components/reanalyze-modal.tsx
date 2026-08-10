"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/blocks/dialog";
import { useApiContext } from "@/context/ApiContext";
import {
  Building2,
  Check,
  Globe2,
  Loader2,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Re-análise com outra IA: regenera resumo, insights e prontuário a partir da
 * transcrição existente — sem transcrever de novo. Só o médico responsável pela
 * consulta enxerga esta ação.
 */

interface PromptOption {
  id: string;
  name: string;
  type: string;
  source: "USER" | "DEPARTMENT" | "COMPANY" | "GLOBAL";
  departmentId?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  USER: "Minha",
  DEPARTMENT: "Especialidade",
  COMPANY: "Clínica",
  GLOBAL: "Padrão",
};

const SOURCE_ICON: Record<string, typeof Globe2> = {
  USER: UserRound,
  DEPARTMENT: Stethoscope,
  COMPANY: Building2,
  GLOBAL: Globe2,
};

/** Opção sentinela: re-analisar com os prompts PADRÃO do sistema (sem IA própria). */
const PADRAO = "__padrao__";

export function ReanalyzeModal({
  recordingId,
  currentPromptId,
  open,
  onClose,
  onDone,
}: {
  recordingId: string;
  currentPromptId?: string | null;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { GetAPI, PostAPI } = useApiContext();
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    (async () => {
      const response = await GetAPI("/prompts/available", true);
      if (response.status === 200) {
        const list = (response.body as PromptOption[]).filter(
          (prompt) => prompt.type === "CLIENT",
        );
        setPrompts(list);
      }
      setLoading(false);
    })();
  }, [open, GetAPI]);

  async function handleReanalyze() {
    if (!selectedId) return;
    setRunning(true);
    const response = await PostAPI(
      `/recording/${recordingId}/reanalyze`,
      selectedId === PADRAO ? {} : { promptId: selectedId },
      true,
    );
    setRunning(false);
    if (response.status === 200 && response.body?.ok !== false) {
      toast.success("Re-análise concluída — atualizando a consulta...");
      if (onDone) {
        onDone();
        onClose();
      } else {
        setTimeout(() => window.location.reload(), 800);
      }
    } else {
      toast.error(
        response.body?.message ||
          "Não foi possível re-analisar. Tente novamente.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !running && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Re-analisar com outra IA</DialogTitle>
          <DialogDescription>
            O resumo, os insights e o prontuário são gerados de novo a partir da
            transcrição já existente — o áudio não é transcrito outra vez. Os
            textos atuais desta consulta serão substituídos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto">
            <button
              onClick={() => setSelectedId(PADRAO)}
              disabled={running}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                selectedId === PADRAO
                  ? "border-blue-500 bg-blue-50/60"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Sparkles size={15} className="shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                IA padrão do sistema
              </span>
              <span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                Sem IA própria
              </span>
              {selectedId === PADRAO && (
                <Check size={14} className="shrink-0 text-blue-600" />
              )}
            </button>
            {prompts.map((prompt) => {
              const Icon = SOURCE_ICON[prompt.source] ?? Globe2;
              const isCurrent = prompt.id === currentPromptId;
              const isSelected = selectedId === prompt.id;
              return (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedId(prompt.id)}
                  disabled={running}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon size={15} className="shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                    {prompt.name}
                  </span>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      atual
                    </span>
                  )}
                  <span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {SOURCE_LABEL[prompt.source] ?? prompt.source}
                  </span>
                  {isSelected && (
                    <Check size={14} className="shrink-0 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={onClose}
            disabled={running}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleReanalyze}
            disabled={!selectedId || running}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:scale-[1.02] disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Re-analisando...
              </>
            ) : (
              "Re-analisar"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
