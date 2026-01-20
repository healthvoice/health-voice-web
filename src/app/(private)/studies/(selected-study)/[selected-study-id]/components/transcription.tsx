"use client";

import { RequestTranscription } from "@/components/ui/request-transcription";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { buildRowsFromSpeeches } from "@/utils/speeches";
import { Check, Copy, Mic, Music } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Transcription() {
  const { selectedRecording } = useGeneralContext();
  const [copied, setCopied] = useState(false);

  const rows = useMemo(
    () =>
      buildRowsFromSpeeches(
        selectedRecording?.speeches,
        selectedRecording?.speakers,
      ),
    [selectedRecording?.speeches, selectedRecording?.speakers],
  );

  const handleCopy = () => {
    if (!selectedRecording?.transcription) return;
    navigator.clipboard.writeText(selectedRecording.transcription);
    setCopied(true);
    toast.success("Transcrição copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Container Principal */}
      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="w-full max-w-none">
          {selectedRecording?.speeches && selectedRecording.speeches.length !== 0 ? (
            <div className="flex flex-col">
              {/* Seção Superior com Áudio */}
              <div className="bg-slate-50/50 p-8 pb-10">
                {selectedRecording?.audioUrl && (
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-4 flex items-center gap-2 text-slate-400">
                      <Music className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Player de Revisão</span>
                    </div>
                    <WaveformAudioPlayer audioUrl={selectedRecording.audioUrl} />
                  </div>
                )}
              </div>

              {/* Lista de Falas (Diarização) */}
              <div className="flex flex-col divide-y divide-slate-50">
                {rows.map((speech) => (
                  <div
                    key={speech.id}
                    className="group flex w-full flex-col gap-3 p-8 transition-colors hover:bg-slate-50/30 md:flex-row md:items-start"
                  >
                    {/* Speaker info */}
                    <div className="flex shrink-0 flex-row items-center gap-3 md:w-48 md:flex-col md:items-start md:gap-1">
                      <span
                        className={cn(
                          "flex h-7 w-max items-center justify-center rounded-full px-3 text-[10px] font-bold uppercase tracking-wider",
                          speech.index === 0
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-500 ring-1 ring-slate-200",
                        )}
                      >
                        {speech.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {speech.t}
                      </span>
                    </div>

                    {/* Text content */}
                    <div className="flex-1">
                      <div className="prose prose-sm prose-slate max-w-none leading-relaxed text-slate-700">
                        {speech.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedRecording?.transcription ? (
            <div className="flex flex-col">
              {/* Seção de Áudio Simplificada para Transcrição em Bloco */}
              <div className="bg-slate-50/50 p-8">
                {selectedRecording?.audioUrl && (
                  <div className="mx-auto max-w-4xl">
                    <WaveformAudioPlayer
                      audioUrl={selectedRecording.audioUrl}
                      videoDuration={selectedRecording.duration}
                    />
                  </div>
                )}
              </div>

              {/* Corpo da Transcrição */}
              <div className="px-8 pb-12 pt-8">
                <div className="mx-auto max-w-4xl">
                  {/* Header do Conteúdo */}
                  <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Mic className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Conteúdo Transcrito</h2>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <span>00:00</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span>{selectedRecording.duration}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="group flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-blue-600 hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4 transition-transform group-hover:scale-110" />
                      )}
                      {copied ? "Copiado!" : "Copiar Texto"}
                    </button>
                  </div>

                  {/* Texto em si */}
                  <div className="prose prose-blue prose-lg max-w-none lg:prose-xl">
                    <div className="whitespace-pre-wrap text-justify leading-loose text-slate-700 decoration-slate-200 outline-none selection:bg-blue-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedRecording.transcription}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-slate-50 text-slate-300">
                <Mic className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Transcrição não disponível</h2>
                <p className="mt-2 text-slate-500">Estamos processando ou aguardando o áudio deste estudo.</p>
              </div>
              <div className="mt-4 w-full max-w-md">
                <RequestTranscription />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
