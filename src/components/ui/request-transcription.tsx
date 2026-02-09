"use client";

import { Modal } from "@/components/ui/modal";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { PromptIcon } from "@/utils/prompt-icon";
import { Check, Loader2, Search, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface PromptOption {
  id: string;
  name: string;
  content: string;
  type: string;
  source: "USER" | "COMPANY" | "GLOBAL";
  icon?: string;
}

export function RequestTranscription() {
  const { selectedRecording, setSelectedRecording } = useGeneralContext();
  const { PutAPI, GetAPI } = useApiContext();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptOption | "default" | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailablePrompts();
    } else {
      setSearchQuery("");
      setSelectedPrompt(null);
    }
  }, [isModalOpen]);

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
      setIsModalOpen(false);
      return setIsRequesting(false);
    }
    toast.error("Erro ao solicitar transcrição!");
    setIsRequesting(false);
  }

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  }

  function handleSelectPrompt(prompt: PromptOption | "default") {
    setSelectedPrompt(prompt);
  }

  function handleConfirmSelection() {
    if (selectedPrompt === "default") {
      HandleRequestTranscription(undefined);
    } else if (selectedPrompt) {
      HandleRequestTranscription(selectedPrompt.id);
    }
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
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm";
      case "COMPANY":
        return "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm";
      case "GLOBAL":
        return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm";
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
        onClick={handleOpenModal}
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="max-w-4xl h-[90vh]"
        className="border-0 bg-white shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50/50">
          {/* Header com gradiente melhorado */}
          <div className="relative flex shrink-0 items-center justify-between border-b border-blue-400/20 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-8 py-6 shadow-lg">
            <div className="flex items-center gap-4">
              <Image
                src="/logos/logo2.png"
                alt="Health Voice Logo"
                width={200}
                height={80}
                className="h-8 w-auto object-contain brightness-0 invert"
                quality={100}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-white/95">
                  Escolha o prompt que será utilizado para a transcrição
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="group rounded-full p-2 text-white transition-all hover:bg-white/25 hover:text-white"
              aria-label="Fechar modal"
            >
              <X size={22} className="transition-transform group-hover:rotate-90" />
            </button>
          </div>

          {/* Content */}
          <div 
            className="relative flex flex-1 flex-col gap-5 p-6" 
            style={{ minHeight: 0 }}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Search Bar melhorada */}
            <div className="relative shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Prompts List melhorada com scroll funcional */}
            <div 
              className={cn(
                "flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar",
                (selectedPrompt === "default" || selectedPrompt) && "pb-24"
              )}
              style={{ minHeight: 0 }}
              onWheel={(e) => e.stopPropagation()}
            >
              {isLoadingPrompts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="mt-4 text-sm text-gray-500">Carregando prompts...</p>
                </div>
              ) : (
                <>
                  {/* Opção de Prompt Padrão - sempre visível */}
                  <button
                    onClick={() => handleSelectPrompt("default")}
                    disabled={isRequesting}
                    className={cn(
                      "group relative flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-left transition-all duration-200",
                      selectedPrompt === "default"
                        ? "border-gray-400 bg-gray-100"
                        : "hover:border-gray-300 hover:bg-gray-100/80",
                      isRequesting && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {/* Ícone menos destacado */}
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-500 transition-colors group-hover:bg-gray-300">
                      <Sparkles size={20} className="text-gray-600" />
                    </div>
                    
                    {/* Conteúdo do prompt padrão */}
                    <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                      <span className="font-medium text-gray-600 transition-colors group-hover:text-gray-700 truncate">
                        Prompt Padrão
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 whitespace-nowrap">
                          Padrão
                        </span>
                        {/* Indicador de seleção */}
                        {selectedPrompt === "default" && (
                          <div className="flex items-center justify-center rounded-full bg-gray-600 p-1.5">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Lista de prompts personalizados */}
                  {filteredPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="rounded-full bg-gray-100 p-3">
                        <Search className="text-gray-400" size={24} />
                      </div>
                      <p className="mt-3 text-center text-sm font-medium text-gray-600">
                        Nenhum prompt encontrado para esta busca
                      </p>
                    </div>
                  ) : (
                    filteredPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      disabled={isRequesting}
                      className={cn(
                        "group relative flex w-full items-center gap-4 rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-all duration-200",
                        selectedPrompt?.id === prompt.id
                          ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-500/20"
                          : "border-gray-100 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10",
                        isRequesting && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {/* Ícone com gradiente melhorado */}
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
                        <PromptIcon
                          icon={prompt.icon}
                          size={24}
                          className="text-white drop-shadow-sm"
                        />
                      </div>
                      
                      {/* Conteúdo do prompt */}
                      <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                        <span className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600 truncate">
                          {prompt.name}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all whitespace-nowrap",
                              getSourceColor(prompt.source),
                            )}
                          >
                            {getSourceLabel(prompt.source)}
                          </span>
                          {/* Indicador de seleção */}
                          {selectedPrompt?.id === prompt.id && (
                            <div className="flex items-center justify-center rounded-full bg-blue-600 p-1.5 shadow-lg">
                              <Check size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                  )}
                </>
              )}
            </div>

            {/* Botão flutuante de confirmação */}
            {selectedPrompt && (
              <div className="absolute bottom-6 left-6 right-6 z-10 animate-in fade-in duration-300">
                <button
                  onClick={handleConfirmSelection}
                  disabled={isRequesting}
                  className={cn(
                    "flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Solicitando transcrição...</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>
                        Confirmar seleção: {selectedPrompt === "default" ? "Prompt Padrão" : selectedPrompt.name}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
