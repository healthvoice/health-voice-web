"use client";

import { AudioRecorder } from "@/components/audio-recorder/audio-recorder";
import { RequestTranscription } from "@/components/ui/request-transcription";
import { useGeneralContext } from "@/context/GeneralContext";
import { AlarmClock, Calendar, FileAudio, Info } from "lucide-react";
import moment from "moment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function General() {
  const { selectedReminder } = useGeneralContext();
  console.log("selectedReminder", selectedReminder);
  if (!selectedReminder) {
    return null;
  }

  const recording = selectedReminder.recording;

  return (
    <div className="flex flex-col gap-6">
      {/* Reminder Info Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Informações do Lembrete
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-semibold text-gray-900">
                {moment.utc(selectedReminder.date).format("DD/MM/YYYY")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <AlarmClock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Horário</p>
              <p className="font-semibold text-gray-900">
                {selectedReminder.time || "--:--"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <FileAudio className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Gravação</p>
              <p className="font-semibold text-gray-900">
                {recording ? recording.duration : "Sem gravação"}
              </p>
            </div>
          </div>
        </div>

        {selectedReminder.description && (
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              {selectedReminder.description}
            </p>
          </div>
        )}
      </div>

      {/* Recording Summary */}
      <div className="prose prose-sm prose-h1:text-center prose-h1:text-primary prose-h2:text-primary w-full max-w-none rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {recording?.summary ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {recording.summary}
          </ReactMarkdown>
        ) : recording?.transcriptionStatus === "PENDING" ? (
          <div className="py-8 text-center">
            <h3 className="text-primary text-lg font-semibold">
              Resumo Pendente
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Estamos processando o resumo da gravação.
            </p>
          </div>
        ) : recording?.transcription ? (
          <div className="py-8 text-start">
            <h3 className="text-primary text-lg font-semibold">Transcrição</h3>
            <p className="mt-2 text-sm text-gray-500">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {recording.transcription}
              </ReactMarkdown>
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <h3 className="text-primary text-lg font-semibold">
              Resumo não disponível
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {recording
                ? "A gravação ainda não possui um resumo."
                : "Este lembrete ainda não possui uma gravação associada."}
            </p>
            {recording && <RequestTranscription />}
          </div>
        )}
      </div>
      {/* 
      <div className="flex justify-center">
        <AudioRecorder
          initialReminderId={selectedReminder.id}
          customLabel="Gravar para este lembrete"
          buttonClassName="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40 active:scale-95"
          skipNewRecordingRequest
        />
      </div> */}
    </div>
  );
}
