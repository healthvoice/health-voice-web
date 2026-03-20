"use client";

import { PendingRecordingEmptyState } from "@/components/pending-recording-empty-state";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { buildRowsFromSpeeches } from "@/utils/speeches";
import { Mic } from "lucide-react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Transcription() {
  const { selectedRecording } = useGeneralContext();

  const rows = useMemo(
    () =>
      buildRowsFromSpeeches(
        selectedRecording?.speeches,
        selectedRecording?.speakers,
      ),
    [selectedRecording?.speeches, selectedRecording?.speakers],
  );

  if (!selectedRecording) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full max-w-none p-6">
        {selectedRecording.speeches && selectedRecording.speeches.length !== 0 ? (
          <div className="flex flex-col gap-4">
            {selectedRecording.audioUrl && (
              <div className="px-4 pt-2">
                <WaveformAudioPlayer
                  audioUrl={selectedRecording.audioUrl}
                  videoDuration={selectedRecording.duration}
                />
              </div>
            )}
            <div>
              {rows.map((speech) => (
                <div
                  key={speech.id}
                  className="flex w-full items-center justify-between gap-2 border-b border-b-gray-200 px-4 py-2 last:border-b-0"
                >
                  <div className="flex gap-2 min-w-0 flex-1">
                    <span className="text-sm text-gray-400 shrink-0">{speech.t}</span>
                    <span className="prose prose-sm max-w-none text-gray-700">
                      {speech.text}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "flex h-8 w-max min-w-40 shrink-0 items-center justify-center rounded-lg border px-2 py-1 text-sm font-semibold",
                      speech.index === 0
                        ? "bg-primary border-primary text-white"
                        : "text-primary border-gray-200 bg-gray-50",
                    )}
                  >
                    {speech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : selectedRecording.transcription ? (
          <div className="flex flex-col items-start gap-4 p-0">
            <div className="flex flex-col gap-2 rounded-md w-full">
              {selectedRecording.audioUrl && (
                <div className="flex w-full items-center justify-center">
                  <WaveformAudioPlayer
                    audioUrl={selectedRecording.audioUrl}
                    videoDuration={selectedRecording.duration}
                  />
                </div>
              )}
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <div className="bg-primary rounded-full p-1">
                    <Mic size={14} color="white" />
                  </div>
                  <p className="font-semibold text-gray-800">Transcrição Completa</p>
                </div>
                <span className="text-sm text-gray-500">
                  00:00 - {selectedRecording.duration}
                </span>
              </div>
              <div className="w-full rounded-xl border border-gray-100 bg-gray-50/50 p-6 text-justify text-base font-medium text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedRecording.transcription}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <PendingRecordingEmptyState
            variant="transcricao"
            className="min-h-[280px] w-full"
          />
        )}
      </div>
    </div>
  );
}
