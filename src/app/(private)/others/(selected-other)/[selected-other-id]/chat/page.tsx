"use client";

import { AudioPlayer } from "@/components/chatPopup/AudioPlayer";
import { useSectionChat } from "@/components/chatPopup/chat-handler";
import { Prompt } from "@/components/chatPopup/types";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { generalPrompt } from "@/utils/prompts";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileText,
  Heart,
  Maximize2,
  Minimize2,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./components/chat-input";
import { SuggestionCard } from "./components/suggestion-card";
import { Messages } from "./messages";

type Suggestion = {
  title: string;
  description: string;
  icon: any;
  prompt: string;
};

export default function ChatPage() {
  const { selectedRecording } = useGeneralContext();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPrompt] = useState(generalPrompt);

  // Derive the prompt object for the hook overrides if needed,
  // but existing logic uses 'selectedPrompt' state likely.
  // We will just send the suggestion text as a message or use it to seed context?
  // effectively 'chat-business' changes the prompt entirely.
  // Here we want to keep "conversation about transcription".
  // So we might just pre-fill the input or send a message.
  // 'chat-business' does: useSectionChat({ selectedPrompt: hookPrompt })
  // Let's stick to the current logic but maybe update the hook if we want strict prompt switching.
  // However, user said "imagine que essa pagina é uma conversa sobre as transcriçoes".
  // The 'generalPrompt' usually handles that.
  // We will pass the suggestion prompt as a "system" or "user" message injection if needed,
  // OR we follow 'chat-business' pattern of changing the prompt context.
  // Let's try to adapt 'chat-business' pattern of "Prompt" object if useSectionChat supports it,
  // but 'others' code was using `selectedPrompt` state.

  const hookPrompt: Prompt | undefined = selectedSuggestion
    ? {
        id: "transcription-prompt",
        name: selectedSuggestion.title,
        prompt: selectedSuggestion.prompt,
      }
    : selectedPrompt;

  const {
    messages,
    setMessages,
    inputMessage,
    handleSendMessage,
    setInputMessage,
    isRecording,
    startRecording,
    stopRecording,
    file,
    setFile,
    loading, // check if loading is available from useSectionChat in this context?
    // 'others' page destructured: messages, setMessages, inputMessage, handleSendMessage, setInputMessage, isRecording, elapsedTime, startRecording, stopRecording, file, setFile
    // It did NOT destructure 'loading'. Let's check if it exists or we need to omit it.
    // 'chat-business' used loading. I'll assume it's there.
  } = useSectionChat({ selectedPrompt: hookPrompt });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const suggestions = [
    {
      title: "Resumir Transcrição",
      description: "Crie um resumo conciso dos principais pontos discutidos.",
      icon: BookOpen,
      prompt: "Resuma a transcrição atual focando nos pontos principais.",
    },
    {
      title: "Extrair Tarefas",
      description: "Liste todas as ações e tarefas mencionadas na conversa.",
      icon: CheckSquare,
      prompt:
        "Liste todas as tarefas e ações pendentes identificadas na transcrição.",
    },
    {
      title: "Análise de Sentimento",
      description: "Analise o tom e o sentimento geral dos participantes.",
      icon: Heart,
      prompt:
        "Analise o sentimento e o tom da conversa baseada na transcrição.",
    },
    {
      title: "Gerar Ata",
      description: "Formate a conversa como uma ata de reunião formal.",
      icon: FileText,
      prompt: "Crie uma ata formal desta reunião baseada na transcrição.",
    },
  ];

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setMessages([]);
    setInputMessage("");
    // If we need to re-inject the transcription as system message when context changes
    if (selectedRecording && selectedRecording?.transcription) {
      // Logic to inject system message is below in useEffect
    }
  };

  const handleBack = () => {
    setSelectedSuggestion(null);
    setMessages([]);
    setInputMessage("");
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputMessage("");
  };
  useEffect(() => {
    handleNewChat();
  }, []);
  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
    if (!isExpanded) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  // Re-inject transcription if messages cleared usually happens via useEffect logic
  useEffect(() => {
    if (messages.length === 0) {
      if (selectedRecording && selectedRecording?.transcription) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: selectedRecording.transcription as string,
          },
        ]);
      }
    }
  }, [messages.length, selectedRecording]); // Watch messages.length to re-trigger on clear

  return (
    <div
      className={`flex w-full flex-col gap-6 ${
        isExpanded ? "" : "h-[calc(100vh-19rem)] overflow-hidden"
      }`}
    >
      {/* Header Standardized - STATIC */}
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assistente de Transcrição
          </h1>
          <p className="text-sm text-gray-500">
            Conversando sobre: {selectedRecording?.name || "Gravação"}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova Conversa
          </button>
        )}
      </div>

      {/* Chat Container - Fixed Layout */}
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 ease-in-out ${
          isExpanded ? "h-[95vh]" : "min-h-0 flex-1"
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
          <div className="absolute top-6 left-6 z-10 flex items-center gap-3 rounded-xl bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
            <button
              onClick={handleBack}
              className="group flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div className="flex items-center gap-2 pr-2">
              <selectedSuggestion.icon className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-semibold text-gray-800">
                {selectedSuggestion.title}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Area */}
        <div className="scrollbar-hide flex-1 overflow-y-auto scroll-smooth p-6">
          {!selectedSuggestion && messages.length <= 1 ? ( // <= 1 because 1 system message (transcription) is hidden
            <div className="flex h-full flex-col">
              <div className="mt-auto py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      index={index}
                      title={suggestion.title}
                      description={suggestion.description}
                      icon={suggestion.icon}
                      onClick={() => handleSuggestionClick(suggestion)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center opacity-60">
                <div
                  className={cn(
                    "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                    "bg-gradient-to-br from-sky-500 to-blue-600",
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
                  <h3 className="text-2xl font-semibold text-gray-700">
                    Comece uma conversa
                  </h3>
                  <p className="text-gray-500">
                    Selecione uma das sugestões abaixo ou digite sua própria
                    pergunta sobre a transcrição.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2 pt-12">
              {messages.length <= 1 && selectedSuggestion && (
                <div className="flex h-full flex-col items-center justify-center opacity-40">
                  <selectedSuggestion.icon className="mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    Modo {selectedSuggestion.title} ativado
                  </p>
                </div>
              )}

              {messages.map(
                (message, i) =>
                  message.role !== "system" && (
                    <Messages
                      key={`business-msg-${i}-${message.content.substring(0, 10)}`}
                      message={message}
                    />
                  ),
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50/50">
          {/* File Preview Area */}
          {file && (
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white/50 px-4 py-2">
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                </div>
                <span className="truncate text-xs font-medium text-gray-500">
                  Áudio anexado
                </span>
              </div>

              <div className="h-8 w-32">
                {/* Mini player or just indicator? The original had full AudioPlayer. 
                     We can render it small or just a 'remove' button. 
                     Let's reproduce the AudioPlayer if possible but compact. */}
                <AudioPlayer
                  audioUrl={URL.createObjectURL(file)}
                  className="h-full w-full"
                />
              </div>

              <button
                onClick={() => setFile(null)}
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={() => handleSendMessage()}
            isRecording={isRecording}
            onRecordStart={startRecording}
            onRecordStop={stopRecording}
            isLoading={typeof loading !== "undefined" ? loading : false}
          />
        </div>
      </div>
    </div>
  );
}
