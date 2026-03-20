"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/blocks/dialog";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { buildRowsFromSpeeches } from "@/utils/speeches";
import {
  Check,
  GripVertical,
  Loader2,
  Pencil,
  Stethoscope,
  User,
  Users,
  X,
} from "lucide-react";
import { PendingRecordingEmptyState } from "@/components/pending-recording-empty-state";
import { useEffect, useMemo, useRef, useState } from "react";

interface SpeakerConfig {
  id: string;
  name: string;
  customName: string;
  isProfessional: boolean;
}

export function Transcription() {
  const { selectedRecording, setSelectedRecording } = useGeneralContext();
  const { PutAPI } = useApiContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mainSpeakerId, setMainSpeakerId] = useState<string | null>(null);
  const [speakerConfigs, setSpeakerConfigs] = useState<SpeakerConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize speaker configs when recording changes
  useEffect(() => {
    if (selectedRecording?.speakers && selectedRecording.speakers.length > 0) {
      const existingConfigs = speakerConfigs.reduce(
        (acc, config) => {
          acc[config.id] = config;
          return acc;
        },
        {} as Record<string, SpeakerConfig>,
      );

      // Check if any speaker already has isProfessional set from API
      const hasProfessionalFromAPI = selectedRecording.speakers.some(
        (s) => s.isProfessional === true,
      );

      const newConfigs = selectedRecording.speakers.map((speaker, index) => {
        // Preserve existing customName and isProfessional if available
        const existing = existingConfigs[speaker.id];
        return {
          id: speaker.id,
          name: speaker.name || `Locutor ${index + 1}`,
          customName: existing?.customName || speaker.name || "",
          isProfessional:
            existing?.isProfessional ??
            speaker.isProfessional ??
            (!hasProfessionalFromAPI && mainSpeakerId === null
              ? index === 0
              : speaker.id === mainSpeakerId),
        };
      });

      setSpeakerConfigs(newConfigs);

      // Set initial main speaker
      if (mainSpeakerId === null && newConfigs.length > 0) {
        const professional = newConfigs.find((c) => c.isProfessional);
        setMainSpeakerId(professional?.id || newConfigs[0].id);
      }
    }
  }, [selectedRecording?.speakers]);

  // Update mainSpeakerId when a speaker is marked as professional
  useEffect(() => {
    const professional = speakerConfigs.find((c) => c.isProfessional);
    if (professional && professional.id !== mainSpeakerId) {
      setMainSpeakerId(professional.id);
    }
  }, [speakerConfigs]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const hasTranscriptionContent =
    (selectedRecording?.speeches && selectedRecording.speeches.length > 0) ||
    !!selectedRecording?.transcription;

  const rows = useMemo(() => {
    // Use custom names from speakerConfigs
    const speakersWithCustomNames = selectedRecording?.speakers?.map(
      (speaker) => {
        const config = speakerConfigs.find((c) => c.id === speaker.id);
        return {
          ...speaker,
          name: config?.customName || config?.name || speaker.name,
        };
      },
    );

    return buildRowsFromSpeeches(
      selectedRecording?.speeches,
      speakersWithCustomNames,
    );
  }, [
    selectedRecording?.speeches,
    selectedRecording?.speakers,
    speakerConfigs,
  ]);

  // Helper to determine if the speaker is the professional (right side)
  const isProfessional = (speakerId: string) => {
    const config = speakerConfigs.find((c) => c.id === speakerId);
    return config?.isProfessional ?? speakerId === mainSpeakerId;
  };

  const getSpeakerColor = (index: number) => {
    const colors = [
      "bg-emerald-100 text-emerald-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
      "bg-cyan-100 text-cyan-600",
      "bg-indigo-100 text-indigo-600",
      "bg-lime-100 text-lime-600",
      "bg-orange-100 text-orange-600",
    ];
    const safeIndex = index < 0 ? 0 : index;
    return colors[safeIndex % colors.length];
  };

  const getSpeakerInitials = (name: string) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    const match = name.match(/\d+/);
    if (match) return match[0];
    return name.charAt(0).toUpperCase();
  };

  const handleSetProfessional = (speakerId: string) => {
    setSpeakerConfigs((prev) =>
      prev.map((config) => ({
        ...config,
        isProfessional: config.id === speakerId,
      })),
    );
  };

  const handleStartEdit = (config: SpeakerConfig) => {
    setEditingId(config.id);
    setEditValue(config.customName || config.name);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      setSpeakerConfigs((prev) =>
        prev.map((config) =>
          config.id === editingId
            ? { ...config, customName: editValue.trim() || config.name }
            : config,
        ),
      );
      setEditingId(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Save speaker configurations to API
  const handleSaveSpeakerConfigs = async () => {
    if (!selectedRecording || speakerConfigs.length === 0) return;

    setIsSaving(true);
    try {
      const speakersToUpdate = speakerConfigs.map((config) => ({
        id: config.id,
        name: config.customName || config.name,
        isProfessional: config.isProfessional,
      }));

      const response = await PutAPI(
        "/recording-speaker",
        { speakers: speakersToUpdate },
        true,
      );

      if (response.status === 200) {
        // Update the selectedRecording with the new speaker data
        setSelectedRecording({
          ...selectedRecording,
          speakers: selectedRecording.speakers.map((speaker) => {
            const config = speakerConfigs.find((c) => c.id === speaker.id);
            return {
              ...speaker,
              name: config?.customName || config?.name || speaker.name,
              isProfessional: config?.isProfessional ?? false,
            };
          }),
        });
        setIsModalOpen(false);
      } else {
        console.error("Erro ao salvar configurações dos locutores");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações dos locutores:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent page scroll when scrolling inside the conversation container
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const isScrollingDown = e.deltaY > 0;
    const isScrollingUp = e.deltaY < 0;

    if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
      e.stopPropagation();
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-lg overflow-hidden p-0 sm:rounded-2xl"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Organizar Locutores
              </DialogTitle>
              <DialogDescription className="mt-2 text-blue-100">
                Configure os participantes da conversa. O profissional aparecerá
                à direita e os demais à esquerda.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-4 p-6">
            {/* Legend */}
            <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                  <Stethoscope className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  Profissional (direita)
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  Paciente/Outro (esquerda)
                </span>
              </div>
            </div>

            {/* Speaker List - overscroll-contain evita que o scroll propague para o fundo; onWheel garante que o wheel não role o body */}
            <div
              className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              {speakerConfigs.map((config, index) => {
                const isActive = config.isProfessional;
                const isEditing = editingId === config.id;

                return (
                  <div
                    key={config.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border-2 p-3 transition-all",
                      isActive
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                    )}
                  >
                    <div className="cursor-grab text-slate-300 hover:text-slate-400">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Avatar */}
                    <button
                      onClick={() => handleSetProfessional(config.id)}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : getSpeakerColor(index),
                      )}
                      title={
                        isActive
                          ? "Profissional selecionado"
                          : "Clique para definir como profissional"
                      }
                    >
                      {isActive ? (
                        <Stethoscope className="h-5 w-5" />
                      ) : (
                        getSpeakerInitials(config.customName || config.name)
                      )}
                    </button>

                    {/* Name */}
                    <div className="flex flex-1 flex-col gap-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSaveEdit}
                            className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-2 ring-blue-500/20 outline-none focus:border-blue-500"
                            placeholder="Nome do locutor"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded-lg bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isActive ? "text-blue-900" : "text-slate-700",
                            )}
                          >
                            {config.customName || config.name}
                          </span>
                          <button
                            onClick={() => handleStartEdit(config)}
                            className="rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-600"
                            title="Editar nome"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <span className="text-xs text-slate-400">
                        {isActive ? "Profissional" : "Paciente/Outro"}
                      </span>
                    </div>

                    {/* Status indicator */}
                    {isActive && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">
                Clique no avatar para alternar o papel
              </p>
              <button
                onClick={handleSaveSpeakerConfigs}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex h-[calc(100vh-250px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex w-full flex-shrink-0 flex-row items-center justify-between border-b border-slate-200 bg-blue-500 bg-gray-50/60 px-4 py-3">
          <h2 className="flex-1 text-base font-semibold text-gray-700">
            Transcrição Completa
          </h2>
          <h2 className="text-primary max-w-[40%] truncate text-base font-bold">
            {selectedRecording?.name}
          </h2>
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {hasTranscriptionContent ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                <Users className="h-4 w-4" />
                Organizar Locutores
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex w-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain p-4"
        >
          {selectedRecording?.speeches.length !== 0 ? (
            rows.map((speech) => {
              const isPro = isProfessional(speech.speakerId);
              return (
                <div
                  key={speech.id}
                  className={cn(
                    "flex w-full gap-3 md:max-w-[85%]",
                    isPro ? "flex-row-reverse self-end" : "flex-row self-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full text-xs font-bold shadow-sm",
                      isPro
                        ? "bg-blue-100 text-blue-600"
                        : getSpeakerColor(speech.index),
                    )}
                  >
                    {isPro ? (
                      <Stethoscope className="h-4 w-4" />
                    ) : (
                      getSpeakerInitials(speech.name)
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col gap-1",
                      isPro ? "items-end" : "items-start",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {speech.name}
                      </span>
                      <span className="text-xs text-gray-400">{speech.t}</span>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        isPro
                          ? "rounded-tr-none bg-blue-600 text-white"
                          : "rounded-tl-none border border-gray-100 bg-white text-gray-700",
                      )}
                    >
                      {speech.text}
                    </div>
                  </div>
                </div>
              );
            })
          ) : selectedRecording?.transcription ? (
            <div className="flex flex-col gap-4 px-4 sm:px-10">
              <p className="text-primary w-full text-justify text-base font-semibold">
                Transcrição Completa
              </p>
              <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm">
                <p className="text-justify text-base leading-relaxed text-gray-700">
                  {selectedRecording.transcription}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <PendingRecordingEmptyState
                variant="transcricao"
                isPrincipal={true}
                className="min-h-[280px] w-full max-w-lg"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
