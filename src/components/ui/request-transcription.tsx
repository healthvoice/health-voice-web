"use client";

import { ActionSheet } from "@/components/ui/action-sheet";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { Eye, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface PromptOption {
  id: string;
  name: string;
  content: string;
  type: string;
  source: "USER" | "COMPANY" | "GLOBAL";
}

export function RequestTranscription() {
  const { selectedRecording, setSelectedRecording } = useGeneralContext();
  const { PutAPI, GetAPI } = useApiContext();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromptForDetail, setSelectedPromptForDetail] =
    useState<PromptOption | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isActionSheetOpen) {
      fetchAvailablePrompts();
    } else {
      setSearchQuery("");
      setSelectedPromptForDetail(null);
    }
  }, [isActionSheetOpen]);

  async function fetchAvailablePrompts() {
    setIsLoadingPrompts(true);
    try {
      const response = await GetAPI(`/prompts/available`, true);
      if (response.status === 200) {
        setPrompts(response.body || []);
      } else {
        console.error("Erro ao buscar prompts:", response.status);
        setPrompts([]);
      }
    } catch (error) {
      console.error("Erro ao buscar prompts:", error);
      setPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  }

  async function HandleRequestTranscription(promptId?: string) {
    if (!selectedRecording) {
      return;
    }
    setIsRequesting(true);
    const request = await PutAPI(
      `/recording/${selectedRecording?.id}`,
      {
        status: "PENDING",
        ...(promptId && { promptId }),
      },
      true,
    );
    if (request.status === 200) {
      toast.success("Solicitação enviada com sucesso!");
      setSelectedRecording({
        ...selectedRecording,
        transcriptionStatus: "PENDING",
      });
      setIsActionSheetOpen(false);
      return setIsRequesting(false);
    }
    toast.error("Erro ao solicitar transcrição!");
    setIsRequesting(false);
  }

  function handleOpenActionSheet() {
    setIsActionSheetOpen(true);
  }

  function handleCloseActionSheet() {
    setIsActionSheetOpen(false);
  }

  function handleSelectPrompt(prompt: PromptOption) {
    HandleRequestTranscription(prompt.id);
  }

  function handleViewPromptDetail(prompt: PromptOption, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedPromptForDetail(prompt);
  }

  function getSourceLabel(source: string) {
    switch (source) {
      case "USER":
        return "Pessoal";
      case "COMPANY":
        return "Empresa";
      case "GLOBAL":
        return "Global";
      default:
        return source;
    }
  }

  function getSourceColor(source: string) {
    switch (source) {
      case "USER":
        return "bg-purple-100 text-purple-800";
      case "COMPANY":
        return "bg-blue-100 text-blue-800";
      case "GLOBAL":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const query = searchQuery.toLowerCase();
    return prompts.filter(
      (prompt) =>
        prompt.name.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query),
    );
  }, [prompts, searchQuery]);

  return (
    <>
      <button
        onClick={handleOpenActionSheet}
        disabled={
          selectedRecording?.transcriptionStatus === "PENDING" || isRequesting
        }
        className={cn(
          "bg-primary absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white",
          selectedRecording?.transcriptionStatus === "PENDING" &&
            "cursor-wait bg-green-400 opacity-50",
          selectedRecording?.transcriptionStatus === "DONE" && "hidden",
        )}
      >
        {isRequesting ? (
          <>
            <Loader2 className="animate-spin" />
            Transcrevendo...
          </>
        ) : selectedRecording?.transcriptionStatus === "PENDING" ? (
          "Transcrição pendente"
        ) : (
          "Solicitar Transcrição"
        )}
      </button>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleCloseActionSheet}
        title="Selecione um prompt"
        description="Escolha o prompt que será utilizado para a transcrição"
      >
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Prompts List */}
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {isLoadingPrompts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {searchQuery
                  ? "Nenhum prompt encontrado para esta busca"
                  : "Nenhum prompt disponível para este tipo de gravação"}
              </div>
            ) : (
              filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50",
                    isRequesting && "opacity-50",
                  )}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <button
                      onClick={() => handleSelectPrompt(prompt)}
                      disabled={isRequesting}
                      className={cn(
                        "flex-1 text-left",
                        isRequesting && "cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {prompt.name}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            getSourceColor(prompt.source),
                          )}
                        >
                          {getSourceLabel(prompt.source)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleViewPromptDetail(prompt, e)}
                      disabled={isRequesting}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900",
                        isRequesting && "cursor-not-allowed opacity-50",
                      )}
                      title="Ver detalhes do prompt"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ActionSheet>

      {/* Modal para exibir detalhes do prompt */}
      {mounted &&
        selectedPromptForDetail &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedPromptForDetail(null);
              }
            }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPromptForDetail.name}
                  </h3>
                  <span
                    className={cn(
                      "w-fit rounded-full px-2.5 py-1 text-xs font-medium",
                      getSourceColor(selectedPromptForDetail.source),
                    )}
                  >
                    {getSourceLabel(selectedPromptForDetail.source)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPromptForDetail(null)}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {selectedPromptForDetail.content || "Sem conteúdo"}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-200 p-4">
                <button
                  onClick={() => {
                    handleSelectPrompt(selectedPromptForDetail);
                    setSelectedPromptForDetail(null);
                  }}
                  disabled={isRequesting}
                  className={cn(
                    "w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary/90",
                    isRequesting && "cursor-not-allowed opacity-50",
                  )}
                >
                  {isRequesting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Processando...
                    </div>
                  ) : (
                    "Usar este prompt"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
