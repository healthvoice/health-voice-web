"use client";

import { useSectionChat } from "@/components/chatPopup/chat-handler";
import { Prompt } from "@/components/chatPopup/types";
import { useSession } from "@/context/auth";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Camera,
  FileText,
  Lightbulb,
  Maximize2,
  Minimize2,
  PanelLeftOpen,
  Plus,
  Stethoscope,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./components/chat-input";
import { ChatSidebar } from "./components/chat-sidebar";
import { Messages } from "./components/messages";
import { SuggestionCard } from "./components/suggestion-card";

type Suggestion = {
  title: string;
  description: string;
  icon: any;
  prompt: string;
};

export default function ChatBusiness() {
  const { profile } = useSession();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Derive the prompt object for the hook
  const hookPrompt: Prompt | undefined = selectedSuggestion
    ? {
      id: "business-prompt",
      name: selectedSuggestion.title,
      prompt: selectedSuggestion.prompt,
    }
    : undefined;

  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    loading,
    isRecording,
    startRecording,
    stopRecording,
    setMessages,
    files,
    setFiles,
  } = useSectionChat({ selectedPrompt: hookPrompt });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const suggestions = [
    {
      title: "Análise de Exames com Imagem",
      description:
        "Envie a foto de um exame para identificar padrões e transcrever os achados clínicos principais.",
      icon: Camera, // Certifique-se de importar o ícone Camera ou Similar
      prompt:
        "Processa exames de imagem para extrair dados técnicos.",
    },
    {
      title: "Análise de Exames",
      description:
        "Interprete resultados laboratoriais e receba uma explicação detalhada sobre cada marcador.",
      icon: FileText, // Certifique-se de importar o ícone FileText
      prompt:
        "Interpreta exames laboratoriais comparando resultados com valores de referência.",
    },
    {
      title: "Ajuda para Diagnóstico",
      description:
        "Descreva sintomas e histórico para obter uma análise de possíveis hipóteses diagnósticas.",
      icon: Stethoscope, // Certifique-se de importar o ícone Stethoscope
      prompt:
        "Auxilia no raciocínio clínico cruzando sintomas, idade e histórico do paciente.",
    },
    {
      title: "Responder Perguntas",
      description: "Tire dúvidas sobre processos ou informações específicas.",
      icon: Lightbulb,
      prompt: "Responda a seguinte pergunta de forma clara e concisa:",
    },
  ];

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setMessages([]); // Clear chat to start fresh context
    setInputMessage(""); // Ensure input is clean
  };

  const handleBack = () => {
    setSelectedSuggestion(null);
    setMessages([]);
    setInputMessage("");
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputMessage("");
    setSelectedSuggestion(null);
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
    // Optional: when expanding, ensure we see the full height
    if (!isExpanded) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  };
  const styles = {
    iconGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    border: "border-sky-200",
  };

  const isChatEmpty = messages.length === 0;

  return (
    <div
      className={`flex w-full gap-6 ${isExpanded ? "" : "h-[calc(100vh-8rem)]"}`}
    >
      {/* Sidebar - Histórico */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-80" : "w-0 overflow-hidden",
          "hidden h-full lg:block",
        )}
      >
        <ChatSidebar
          onToggle={() => setIsSidebarOpen(false)} // Inner close button
          onNewChat={handleNewChat}
          className="h-full w-full"
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden">
        {/* Header Standardized - STATIC */}
        <div className="flex w-full shrink-0 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Open Sidebar Trigger - Visible when sidebar is closed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 lg:flex"
                title="Abrir Histórico"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inteligência Artificial
              </h1>
              <p className="text-sm text-gray-500">
                Olá, {profile?.name?.split(" ")[0] || "Usuário"}. Como posso
                ajudar?
              </p>
            </div>
          </div>

          {/* Create New Chat Button (Mobile/Tablet or redundant) */}
          <div className="lg:hidden">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Nova Conversa
            </button>
          </div>
        </div>

        {/* Chat Container - Fixed Layout */}
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 ease-in-out ${isExpanded ? "h-[90vh]" : "flex-1"
            }`}
        >
          {/* Toggle Expand Button - Top Right */}
          <button
            onClick={handleToggleExpand}
            className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100/50 text-gray-500 backdrop-blur-sm transition-all hover:bg-gray-200 hover:text-gray-700 active:scale-95"
            title={isExpanded ? "Restaurar tamanho" : "Expandir tela"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Suggestion Mode Overlay */}
          {selectedSuggestion && (
            <div className="animate-in fade-in slide-in-from-top-4 absolute top-6 left-6 z-10 flex items-center gap-3 duration-300">
              <button
                onClick={handleBack}
                className="group hover:bg-primary flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:text-white active:scale-95"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <div className="border-primary flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md">
                <selectedSuggestion.icon className="text-primary h-4 w-4" />
                <span className="text-sm font-semibold text-gray-700">
                  {selectedSuggestion.title}
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Area */}
          <div
            className={cn(
              "scrollbar-hide relative flex-1 p-6",
              isChatEmpty && !selectedSuggestion
                ? "overflow-hidden"
                : "overflow-y-auto scroll-smooth",
            )}
          >
            {!selectedSuggestion && isChatEmpty ? (
              <div className="flex h-full flex-col">
                <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div
                      className={cn(
                        "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                        styles.iconGradient,
                      )}
                    >
                      <Image
                        className="h-12 w-12"
                        src={"/logos/iconWhite.png"}
                        alt="Icon"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="max-w-md space-y-2">
                      <h3 className="text-2xl font-semibold text-black">
                        Comece uma conversa
                      </h3>
                      <p className="text-gray-500">
                        Selecione uma das sugestões abaixo ou digite sua própria
                        pergunta para começar.
                      </p>
                    </div>
                  </div>

                  <div className="z-20 mt-6 w-full max-w-2xl px-4">
                    <ChatInput
                      value={inputMessage}
                      onChange={setInputMessage}
                      onSend={() => handleSendMessage()}
                      isRecording={isRecording}
                      onRecordStart={startRecording}
                      onRecordStop={stopRecording}
                      isLoading={loading}
                      files={files}
                      onFilesChange={setFiles}
                    />
                  </div>
                </div>
                <div className="mt-auto py-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {suggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={index}
                        index={index}
                        title={suggestion.title}
                        icon={suggestion.icon}
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-full flex-col gap-4 py-2 pt-12">
                {/* If just starting a suggestion mode but no messages yet */}
                {messages.length === 0 && selectedSuggestion && (
                  <div className="animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center duration-500">
                    <div className="bg-primary mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white">
                      <selectedSuggestion.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Modo {selectedSuggestion.title} Ativado
                    </h3>
                    <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
                      {selectedSuggestion.prompt.replace(":", "...")}
                    </p>
                  </div>
                )}

                {messages.map((message, i) => (
                  <Messages
                    key={`business-msg-${i}-${message.content.substring(0, 10)}`}
                    message={message}
                  />
                ))}
                <div ref={bottomRef} className="h-2" />
              </div>
            )}
          </div>

          {(!isChatEmpty || selectedSuggestion) && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <ChatInput
                value={inputMessage}
                onChange={setInputMessage}
                onSend={() => handleSendMessage()}
                isRecording={isRecording}
                onRecordStart={startRecording}
                onRecordStop={stopRecording}
                isLoading={loading}
                files={files}
                onFilesChange={setFiles}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
