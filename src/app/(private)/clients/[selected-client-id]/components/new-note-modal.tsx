"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/blocks/dialog";
import { useMediaRecorder } from "@/components/audio-recorder/use-media-recorder";
import { useRecordingActions } from "@/services/recordingService";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  Mic,
  Pause,
  RefreshCw,
  Send,
  StickyNote,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ID do paciente para vincular a nota */
  clientId?: string;
  /** Chamado após salvar a nota com sucesso (ex.: para atualizar a lista) */
  onSuccess?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Step = "form" | "recording" | "preview" | "saving";

const TOTAL_STEPS = 3;

const STEP_CONFIG: Record<
  Step,
  { index: number; title: string; subtitle: string }
> = {
  form: {
    index: 0,
    title: "Nova Nota",
    subtitle: "Passo 1 de 3",
  },
  recording: {
    index: 1,
    title: "Gravando...",
    subtitle: "Passo 2 de 3",
  },
  preview: {
    index: 2,
    title: "Revisar Gravação",
    subtitle: "Passo 3 de 3",
  },
  saving: {
    index: 2,
    title: "Processando...",
    subtitle: "Enviando nota...",
  },
};

/**
 * Modal só para notas: formulário (nome opcional) + gravação de áudio.
 * Estilo alinhado ao fluxo "Gravar Lembrete" do audio-recorder: stepper, telas de gravar e revisar.
 * Usa recordingService para upload e criação (tipo OTHER) com clientId.
 */
export function NewNoteModal({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: NewNoteModalProps) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const { uploadAndCreateRecording } = useRecordingActions();

  const handleConfirmAndSend = useCallback(
    async (blob: Blob, duration: number) => {
      if (!clientId) {
        toast.error("Paciente não selecionado.");
        setStep("form");
        return;
      }
      setStep("saving");
      const result = await uploadAndCreateRecording({
        blob,
        mediaType: "audio",
        type: "OTHER",
        seconds: duration,
        name: name.trim() || undefined,
        clientId,
      });
      if (result.success) {
        toast.success("Nota salva com sucesso!");
        onSuccess?.();
        onOpenChange(false);
        setStep("form");
        setName("");
      } else {
        toast.error(result.error ?? "Erro ao salvar nota.");
        setStep("preview");
      }
    },
    [clientId, name, uploadAndCreateRecording, onSuccess, onOpenChange],
  );

  const recorder = useMediaRecorder({
    mediaType: "audio",
    onComplete: undefined,
    onError: (err) => {
      toast.error(err.message ?? "Erro na gravação.");
      setStep("form");
    },
  });

  // Ao parar a gravação, ir para o passo de revisão (preview)
  useEffect(() => {
    if (
      step === "recording" &&
      recorder.mediaBlob &&
      !recorder.isRecording
    ) {
      setStep("preview");
    }
  }, [step, recorder.mediaBlob, recorder.isRecording]);

  // Carregar áudio no elemento ao entrar no preview
  useEffect(() => {
    if (step === "preview" && recorder.mediaUrl && audioPreviewRef.current) {
      audioPreviewRef.current.src = recorder.mediaUrl;
      audioPreviewRef.current.load();
    }
  }, [step, recorder.mediaUrl]);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setName("");
      if (recorder.mediaUrl) {
        recorder.resetRecording();
      }
    }
  }, [open]);

  const handleStartRecording = async () => {
    if (!clientId) {
      toast.error("Selecione um paciente.");
      return;
    }
    try {
      await recorder.startRecording();
      setStep("recording");
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
  };

  const handleRetryRecording = () => {
    recorder.resetRecording();
    setStep("form");
  };

  const handleClose = () => {
    if (step === "recording" && recorder.isRecording) {
      recorder.stopRecording();
      recorder.resetRecording();
    }
    setStep("form");
    setName("");
    onOpenChange(false);
  };

  const config = STEP_CONFIG[step];
  const canClose =
    step !== "saving" && !(step === "recording" && recorder.isRecording);

  return (
    <Dialog open={open} onOpenChange={canClose ? handleClose : undefined}>
      <DialogContent
        className="max-w-lg border-0 p-0 shadow-2xl sm:rounded-3xl"
        onPointerDownOutside={canClose ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={canClose ? undefined : (e) => e.preventDefault()}
      >
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white">
          {/* Header — mesmo estilo do audio-recorder */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                <StickyNote className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {config.title}
                </h2>
                <p className="text-xs text-gray-400">{config.subtitle}</p>
              </div>
            </div>
            {canClose && (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Barra de progresso (stepper) */}
          <div className="flex gap-1.5 px-6 pt-3 pb-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  i <= config.index ? "bg-blue-600" : "bg-gray-200",
                )}
              />
            ))}
          </div>

          {/* Conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ maxHeight: "70vh" }}>
            {/* ═══ FORM (Passo 1) ═══ */}
            {step === "form" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-sm text-gray-700">
                    Grave um áudio para esta nota. Você pode dar um nome opcional
                    à gravação para identificá-la depois.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Nome da gravação{" "}
                    <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Observações gerais, Anotação rápida..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={!clientId}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Mic size={20} />
                    Iniciar Gravação
                  </button>
                </div>
              </div>
            )}

            {/* ═══ RECORDING (Passo 2) ═══ */}
            {step === "recording" && (
              <>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-blue-600">
                      <Mic size={40} className="text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 animate-ping rounded-full bg-blue-600" />
                  </div>
                  <p className="mt-6 text-3xl font-bold text-gray-800 tabular-nums">
                    {formatDuration(recorder.duration)}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Gravando áudio...
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <Pause size={20} />
                    Parar Gravação
                  </button>
                </div>
              </>
            )}

            {/* ═══ PREVIEW (Passo 3) ═══ */}
            {step === "preview" && (
              <>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                      <Volume2 size={32} className="text-blue-600" />
                    </div>
                    <audio
                      ref={audioPreviewRef}
                      controls
                      className="w-full max-w-sm"
                    >
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Duração
                      </p>
                      <p className="text-base font-bold text-gray-800">
                        {formatDuration(recorder.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Tipo
                      </p>
                      <p className="text-base font-bold text-gray-800">
                        Áudio
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-start gap-2 text-xs text-blue-800">
                      <AlertCircle
                        size={16}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <p>
                        Reproduza e verifique se a qualidade está boa antes de
                        enviar.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleRetryRecording}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <RefreshCw size={16} />
                    Regravar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      recorder.mediaBlob &&
                      handleConfirmAndSend(recorder.mediaBlob, recorder.duration)
                    }
                    disabled={!recorder.mediaBlob}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Send size={16} />
                    Confirmar e Enviar
                  </button>
                </div>
              </>
            )}

            {/* ═══ SAVING ═══ */}
            {step === "saving" && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-5 text-base font-semibold text-gray-800">
                  Salvando nota...
                </p>
                <p className="mt-1.5 text-center text-sm text-gray-500">
                  Aguarde enquanto preparamos sua nota
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
