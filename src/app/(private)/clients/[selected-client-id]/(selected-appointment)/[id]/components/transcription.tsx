"use client";

import { ActionSheet } from "@/components/ui/action-sheet";
import { RequestTranscription } from "@/components/ui/request-transcription";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { buildRowsFromSpeeches } from "@/utils/speeches";
import { Check, Plus, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function Transcription() {
  const { selectedRecording } = useGeneralContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mainSpeakerId, setMainSpeakerId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      buildRowsFromSpeeches(
        selectedRecording?.speeches,
        selectedRecording?.speakers,
      ),
    [selectedRecording?.speeches, selectedRecording?.speakers],
  );

  // Initialize main speaker with the first one if not set
  useEffect(() => {
    if (
      mainSpeakerId === null &&
      selectedRecording?.speakers &&
      selectedRecording.speakers.length > 0
    ) {
      setMainSpeakerId(selectedRecording.speakers[0].id);
    }
  }, [selectedRecording, mainSpeakerId]);

  // Helper to determine if the speaker is likely the professional (right side)
  const isProfessional = (speakerId: string) => {
    return speakerId === mainSpeakerId;
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
    // Use modulo to cycle through colors if there are many speakers
    // Add logic to handle negative index if any
    const safeIndex = index < 0 ? 0 : index;
    return colors[safeIndex % colors.length];
  };

  const getSpeakerInitials = (name: string) => {
    const match = name.match(/\d+/);
    if (match) return match[0];
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <ActionSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Organizar Locutores"
        description="Selecione o locutor principal (médico/profissional) para ajustar a visualização da conversa."
      >
        <div className="flex w-full flex-col gap-5">
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
            {selectedRecording?.speakers?.map((speaker, index) => {
              const isActive = mainSpeakerId === speaker.id;
              return (
                <button
                  key={speaker.id}
                  onClick={() => setMainSpeakerId(speaker.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 transition-all",
                    isActive
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
                        isActive
                          ? "bg-blue-600 text-white"
                          : getSpeakerColor(index),
                      )}
                    >
                      {isActive ? (
                        <Stethoscope className="h-4 w-4" />
                      ) : speaker.name ? (
                        getSpeakerInitials(speaker.name)
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-blue-900" : "text-slate-700",
                      )}
                    >
                      {speaker.name || `Locutor ${index + 1}`}
                    </span>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-blue-600" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Concluir
            </button>
          </div>
        </div>
      </ActionSheet>

      <div className="flex max-h-[calc(100vh-200px)] w-full flex-col gap-6 overflow-y-auto rounded-2xl border border-slate-200 p-4">
        <div className="flex w-full flex-row items-center justify-between border-b border-b-slate-200 px-4 pt-2 pb-2">
          <div className="flex-1" />
          {/* {selectedRecording?.audioUrl && (
            <WaveformAudioPlayer
              audioUrl={selectedRecording.audioUrl}
              videoDuration={selectedRecording.duration}
            />
          )} */}
          <div className="flex flex-1 items-center justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 font-medium text-white transition-all hover:shadow-lg hover:shadow-sky-500/25 active:scale-95"
            >
              <Plus className="h-6 w-6" />
              Organizar Locutores
            </button>
          </div>
        </div>
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
          <div className="flex flex-col gap-4 px-10">
            <p className="text-primary m-auto w-full text-justify text-base font-extrabold">
              Transcrição Completa
            </p>
            <div className="m-auto w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-justify text-base leading-relaxed font-medium text-gray-700">
                {selectedRecording.transcription}
              </p>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-primary m-auto w-full text-center text-3xl font-extrabold md:w-max">
              Transcrição não disponível
            </h1>
            <div className="prose prose-sm prose-h1:text-center prose-h1:text-primary prose-h2:text-primary w-full max-w-none">
              <RequestTranscription />
            </div>
          </>
        )}
      </div>
    </>
  );
}
