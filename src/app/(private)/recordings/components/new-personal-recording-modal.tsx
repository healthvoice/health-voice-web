"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/blocks/dialog";
import { useMediaRecorder } from "@/components/audio-recorder/use-media-recorder";
import { useRecordingActions } from "@/services/recordingService";
import type { RecordingType } from "@/services/recordingService";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  BookOpen,
  Mic,
  Pause,
  Pen,
  RefreshCw,
  Send,
  TriangleAlert,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export type PersonalRecordingVariant = "STUDY" | "OTHER";

interface NewPersonalRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "STUDY" ou "OTHER" — quando omitido, exibe passo de escolha (Estudo | Outros) na home */
  variant?: PersonalRecordingVariant;
  /** Chamado após salvar com sucesso */
  onSuccess?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Step = "choice" | "form" | "recording" | "preview" | "saving";

const TOTAL_STEPS_WITH_CHOICE = 4;
const TOTAL_STEPS_WITHOUT_CHOICE = 3;

const VARIANT_CONFIG: Record<
  PersonalRecordingVariant,
  {
    title: string;
    formTitle: string;
    Icon: React.ComponentType<{ className?: string }>;
    placeholder: string;
    savingLabel: string;
    successMessage: string;
  }
> = {
  STUDY: {
    title: "Novo Estudo",
    formTitle: "Novo Estudo",
    Icon: Pen,
    placeholder: "Ex: Análise de dados, Revisão...",
    savingLabel: "Salvando estudo...",
    successMessage: "Estudo salvo com sucesso!",
  },
  OTHER: {
    title: "Outra Gravação",
    formTitle: "Outra Gravação",
    Icon: TriangleAlert,
    placeholder: "Ex: Observações gerais, Anotação rápida...",
    savingLabel: "Salvando gravação...",
    successMessage: "Gravação salva com sucesso!",
  },
};

/**
 * Modal para gravação pessoal: Estudos ou Outros. Com variant: form → gravar → revisar → salvar.
 * Sem variant (home): passo de escolha (Estudo | Outros) → form → gravar → revisar → salvar.
 */
export function NewPersonalRecordingModal({
  open,
  onOpenChange,
  variant: variantProp,
  onSuccess,
}: NewPersonalRecordingModalProps) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>(variantProp ? "form" : "choice");
  const [selectedVariant, setSelectedVariant] = useState<PersonalRecordingVariant | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const { uploadAndCreateRecording } = useRecordingActions();
  const effectiveVariant = variantProp ?? selectedVariant;
  const hasChoiceStep = variantProp == null;
  const config = effectiveVariant ? VARIANT_CONFIG[effectiveVariant] : null;
  const IconComponent = config?.Icon ?? BookOpen;

  const getStepTitle = (s: Step): { title: string; subtitle: string } => {
    const total = hasChoiceStep ? TOTAL_STEPS_WITH_CHOICE : TOTAL_STEPS_WITHOUT_CHOICE;
    if (s === "choice") return { title: "Gravação Pessoal", subtitle: "Passo 1 de 4" };
    if (s === "form" && config) return { title: config.formTitle, subtitle: hasChoiceStep ? "Passo 2 de 4" : "Passo 1 de 3" };
    if (s === "recording") return { title: "Gravando...", subtitle: hasChoiceStep ? "Passo 3 de 4" : "Passo 2 de 3" };
    if (s === "preview") return { title: "Revisar Gravação", subtitle: hasChoiceStep ? "Passo 4 de 4" : "Passo 3 de 3" };
    if (s === "saving" && config) return { title: "Processando...", subtitle: config.savingLabel };
    return { title: "", subtitle: "" };
  };
  const stepConfig = getStepTitle(step);

  const handleConfirmAndSend = useCallback(
    async (blob: Blob, duration: number) => {
      if (!effectiveVariant) return;
      setStep("saving");
      const result = await uploadAndCreateRecording({
        blob,
        mediaType: "audio",
        type: effectiveVariant as RecordingType,
        seconds: duration,
        name: name.trim() || undefined,
      });
      if (result.success) {
        toast.success(VARIANT_CONFIG[effectiveVariant].successMessage);
        onSuccess?.();
        onOpenChange(false);
        setStep(hasChoiceStep ? "choice" : "form");
        setName("");
        setSelectedVariant(null);
      } else {
        toast.error(result.error ?? "Erro ao salvar.");
        setStep("preview");
      }
    },
    [effectiveVariant, hasChoiceStep, name, uploadAndCreateRecording, onSuccess, onOpenChange],
  );

  const recorder = useMediaRecorder({
    mediaType: "audio",
    onComplete: undefined,
    onError: (err) => {
      toast.error(err.message ?? "Erro na gravação.");
      setStep("form");
    },
  });

  useEffect(() => {
    if (step === "recording" && recorder.mediaBlob && !recorder.isRecording) {
      setStep("preview");
    }
  }, [step, recorder.mediaBlob, recorder.isRecording]);

  useEffect(() => {
    if (step === "preview" && recorder.mediaUrl && audioPreviewRef.current) {
      audioPreviewRef.current.src = recorder.mediaUrl;
      audioPreviewRef.current.load();
    }
  }, [step, recorder.mediaUrl]);

  useEffect(() => {
    if (!open) {
      setStep(variantProp ? "form" : "choice");
      setName("");
      setSelectedVariant(null);
      if (recorder.mediaUrl) recorder.resetRecording();
    }
  }, [open, variantProp]);

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
      setStep("recording");
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const handleStopRecording = () => recorder.stopRecording();
  const handleRetryRecording = () => {
    recorder.resetRecording();
    setStep("form");
  };

  const handleClose = () => {
    if (step === "recording" && recorder.isRecording) {
      recorder.stopRecording();
      recorder.resetRecording();
    }
    setStep(hasChoiceStep ? "choice" : "form");
    setName("");
    setSelectedVariant(null);
    onOpenChange(false);
  };

  const totalSteps = hasChoiceStep ? TOTAL_STEPS_WITH_CHOICE : TOTAL_STEPS_WITHOUT_CHOICE;
  const stepIndex =
    step === "choice" ? 0 : step === "form" ? (hasChoiceStep ? 1 : 0) : step === "recording" ? (hasChoiceStep ? 2 : 1) : step === "preview" || step === "saving" ? totalSteps - 1 : 0;
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
          <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {stepConfig.title}
                </h2>
                <p className="text-xs text-gray-400">{stepConfig.subtitle}</p>
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

          <div className="flex gap-1.5 px-6 pt-3 pb-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  i <= stepIndex ? "bg-blue-600" : "bg-gray-200",
                )}
              />
            ))}
          </div>

          <div
            className="flex-1 overflow-y-auto px-6 py-5"
            style={{ maxHeight: "70vh" }}
          >
            {step === "choice" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-sm text-gray-700">
                    Escolha o tipo de gravação e em seguida grave seu áudio.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant("STUDY");
                      setStep("form");
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-5 transition-all hover:border-emerald-400 hover:bg-emerald-50/50"
                  >
                    <Pen size={28} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-800">Estudos</span>
                    <span className="text-xs text-gray-500">Análise, revisão...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVariant("OTHER");
                      setStep("form");
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-5 transition-all hover:border-blue-400 hover:bg-blue-50/50"
                  >
                    <TriangleAlert size={28} className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">Outros</span>
                    <span className="text-xs text-gray-500">Anotações rápidas</span>
                  </button>
                </div>
              </div>
            )}

            {step === "form" && config && (
              <div className="space-y-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-sm text-gray-700">
                    {effectiveVariant === "STUDY"
                      ? "Grave um áudio para seu estudo. Você pode dar um nome opcional à gravação."
                      : "Grave um áudio. Você pode dar um nome opcional à gravação para identificá-la depois."}
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
                    placeholder={config.placeholder}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]"
                  >
                    <Mic size={20} />
                    Iniciar Gravação
                  </button>
                </div>
              </div>
            )}

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
                  <p className="mt-2 text-sm text-gray-500">Gravando áudio...</p>
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
                      <p className="text-xs font-medium text-gray-500">Tipo</p>
                      <p className="text-base font-bold text-gray-800">Áudio</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-start gap-2 text-xs text-blue-800">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
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

            {step === "saving" && config && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-5 text-base font-semibold text-gray-800">
                  {config.savingLabel}
                </p>
                <p className="mt-1.5 text-center text-sm text-gray-500">
                  Aguarde enquanto preparamos sua gravação
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
