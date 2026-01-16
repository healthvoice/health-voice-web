"use client";

import { RequestTranscription } from "@/components/ui/request-transcription";
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
  console.log("selectedRecording", selectedRecording);
  const rows = useMemo(
    () =>
      buildRowsFromSpeeches(
        selectedRecording?.speeches,
        selectedRecording?.speakers,
      ),
    [selectedRecording?.speeches],
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="prose-h1:text-center prose-h1:text-primary prose-h2:text-primary w-full max-w-none">
        {selectedRecording?.speeches.length !== 0 ? (
          <div className="flex flex-col gap-4">
            {selectedRecording?.audioUrl && (
              <div className="px-4 pt-2">
                <WaveformAudioPlayer audioUrl={selectedRecording.audioUrl} />
              </div>
            )}
            <div>
              {rows.map((speech) => (
                <div
                  key={speech.id}
                  className="flex w-full items-center justify-between gap-2 border-b border-b-gray-300 px-4 py-2"
                >
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-300">{speech.t}</span>
                    <span className="prose prose-sm max-w-none">
                      {speech.text}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "flex h-8 w-max min-w-40 items-center justify-center rounded-md border px-2 py-1 text-sm font-semibold",
                      speech.index === 0
                        ? "bg-primary border-primary text-white"
                        : "text-primary border-neutral-200 bg-white",
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
            {/* <p className="text-primary w-full text-justify text-base font-extrabold">
              Transcrição Completa
            </p> */}
            <div className="flex flex-col gap-2 rounded-md">
              <div className="flex w-full items-center justify-center">
                {selectedRecording?.audioUrl && (
                  <WaveformAudioPlayer
                    audioUrl={selectedRecording.audioUrl}
                    videoDuration={selectedRecording.duration}
                  />
                )}
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <div className="bg-primary rounded-full p-1">
                    <Mic size={14} color="white" />
                  </div>
                  <p className="font-semibold">Transcrição Completa</p>
                </div>
                <span className="text-sm">
                  00:00 - {selectedRecording.duration}
                </span>
              </div>

              <div className="w-full text-justify text-base font-medium text-black">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedRecording.transcription}
                </ReactMarkdown>
              </div>
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
    </div>
  );
}
