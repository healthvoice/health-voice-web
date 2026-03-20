"use client";

import { useMediaRecorder } from "@/components/audio-recorder/use-media-recorder";
import { Dialog, DialogContent } from "@/components/ui/blocks/dialog";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { useRecordingActions } from "@/services/recordingService";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { cn } from "@/utils/cn";
import { handleApiError } from "@/utils/error-handler";
import { getCurrentPlatform } from "@/utils/platform";
import {
  AlertCircle,
  Bell,
  Mic,
  Pause,
  RefreshCw,
  Send,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após salvar o lembrete com sucesso */
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
    title: "Novo Lembrete",
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
    subtitle: "Enviando lembrete...",
  },
};

/**
 * Modal para novo lembrete: descrição opcional + gravação. Nome, data e horário enviados vazios/placeholder.
 */
export function NewReminderModal({
  open,
  onOpenChange,
  onSuccess,
}: NewReminderModalProps) {
  const { PostAPI, GetAPI } = useApiContext();
  const { GetReminders } = useGeneralContext();
  const { uploadAndCreateRecording } = useRecordingActions();

  const modalSourceRef = useRef<string>("reminders-page");
  const hasCompletedRecordingRef = useRef<boolean>(false);
  const hasModalOpenedRef = useRef<boolean>(false);

  const [description, setDescription] = useState("");
  const [step, setStep] = useState<Step>("form");
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const createReminderAndGetId = useCallback(async (): Promise<
    string | null
  > => {
    const today = new Date().toISOString().slice(0, 10);
    const dateIso = `${today}T12:00:00.000Z`;
    const response = await PostAPI(
      "/reminder",
      {
        name: " ",
        description: description.trim() ? description.trim() : " ",
        date: dateIso,
        time: "09:00",
        platform: getCurrentPlatform(),
      },
      true,
    );
    if (response.status >= 400) {
      const msg = handleApiError(
        response,
        "Erro ao criar lembrete. Tente novamente.",
      );
      toast.error(msg);
      return null;
    }
    const listRes = await GetAPI("/reminder?page=1", true);
    if (listRes.status !== 200 || !listRes.body?.reminders?.length) {
      toast.error("Lembrete criado, mas não foi possível vincular a gravação.");
      return null;
    }
    const reminders = listRes.body.reminders as Array<{ id: string }>;
    return reminders[0]?.id ?? null;
  }, [description, PostAPI, GetAPI]);

  const handleConfirmAndSend = useCallback(
    async (blob: Blob, duration: number) => {
      setStep("saving");
      const reminderId = await createReminderAndGetId();
      if (!reminderId) {
        setStep("preview");
        return;
      }
      const result = await uploadAndCreateRecording({
        blob,
        mediaType: "audio",
        type: "REMINDER",
        seconds: duration,
        reminderId,
      });
      if (result.success) {
        // Tracking: RECORDING_COMPLETED quando gravação é salva com sucesso
        hasCompletedRecordingRef.current = true;
        trackAction(
          {
            actionType: UserActionType.RECORDING_COMPLETED,
            metadata: {
              modalId: "new-reminder-modal",
              source: modalSourceRef.current,
              recordingType: "PERSONAL",
              personalRecordingType: "REMINDER",
              duration: duration,
              seconds: duration,
            },
          },
          PostAPI,
        ).catch((error) => {
          console.warn("Erro ao registrar RECORDING_COMPLETED:", error);
        });

        toast.success("Lembrete criado e gravação salva!");
        GetReminders();
        onSuccess?.();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error ?? "Erro ao salvar gravação.");
        setStep("preview");
      }
    },
    [
      createReminderAndGetId,
      uploadAndCreateRecording,
      GetReminders,
      onSuccess,
      onOpenChange,
      PostAPI,
    ],
  );

  const recorder = useMediaRecorder({
    mediaType: "audio",
    onComplete: undefined,
    onError: (err) => {
      toast.error(err.message ?? "Erro na gravação.");
      setStep("form");
    },
  });

  const resetForm = useCallback(() => {
    setStep("form");
    setDescription("");
    if (recorder.mediaUrl) recorder.resetRecording();
  }, [recorder]);

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

  // Tracking: MODAL_OPENED quando a modal é aberta
  useEffect(() => {
    if (open && step === "form" && !hasModalOpenedRef.current) {
      // Determinar source da modal
      const pathname = window.location.pathname;
      let source = "reminders-page";
      if (pathname.includes("/home") || pathname === "/") {
        source = "home-page";
      } else if (pathname.includes("/clients")) {
        source = "clients-page";
      } else if (pathname.includes("/reminders")) {
        source = "reminders-page";
      } else if (pathname.includes("/studies")) {
        source = "studies-page";
      } else if (pathname.includes("/others")) {
        source = "others-page";
      }
      
      modalSourceRef.current = source;
      hasModalOpenedRef.current = true;

      trackAction(
        {
          actionType: UserActionType.MODAL_OPENED,
          metadata: {
            modalId: "new-reminder-modal",
            source,
            recordingType: "PERSONAL",
            personalRecordingType: "REMINDER",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_OPENED:", error);
      });
    }
  }, [open, step, PostAPI]);

  // Tracking: MODAL_CLOSED quando a modal é fechada (apenas se não completou gravação)
  useEffect(() => {
    if (!open && hasModalOpenedRef.current && !hasCompletedRecordingRef.current) {
      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata: {
            modalId: "new-reminder-modal",
            source: modalSourceRef.current,
            reason: "cancelled",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_CLOSED:", error);
      });
    }
    // Reset ref quando modal fecha
    if (!open) {
      hasModalOpenedRef.current = false;
    }
  }, [open, PostAPI]);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setDescription("");
      hasCompletedRecordingRef.current = false;
      hasModalOpenedRef.current = false;
      if (recorder.mediaUrl) recorder.resetRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when open closes
  }, [open]);

  const handleStartRecording = async () => {
    try {
      // Tracking: RECORDING_STARTED quando inicia gravação
      trackAction(
        {
          actionType: UserActionType.RECORDING_STARTED,
          metadata: {
            modalId: "new-reminder-modal",
            source: modalSourceRef.current,
            recordingType: "PERSONAL",
            personalRecordingType: "REMINDER",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar RECORDING_STARTED:", error);
      });

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
    // Tracking: RECORDING_CANCELLED quando clica em "Regravar"
    trackAction(
      {
        actionType: UserActionType.RECORDING_CANCELLED,
        metadata: {
          recordingType: "PERSONAL",
          personalRecordingType: "REMINDER",
          duration: recorder.duration,
          hadBlob: !!recorder.mediaBlob,
          step: "preview",
          reason: "retry",
        },
      },
      PostAPI,
    ).catch((error) => {
      console.warn("Erro ao registrar RECORDING_CANCELLED:", error);
    });

    recorder.resetRecording();
    setStep("form");
  };

  const handleClose = () => {
    // Tracking: RECORDING_CANCELLED quando fecha modal durante gravação/preview
    if ((step === "recording" || step === "preview") && !hasCompletedRecordingRef.current) {
      trackAction(
        {
          actionType: UserActionType.RECORDING_CANCELLED,
          metadata: {
            recordingType: "PERSONAL",
            personalRecordingType: "REMINDER",
            duration: recorder.duration,
            hadBlob: !!recorder.mediaBlob,
            step: step === "recording" ? "recording" : "preview",
            reason: "dismissed",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar RECORDING_CANCELLED:", error);
      });
    }

    if (step === "recording" && recorder.isRecording) {
      recorder.stopRecording();
      recorder.resetRecording();
    }
    resetForm();
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
          <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                <Bell className="h-5 w-5 text-white" />
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
                data-tracking-id="new-reminder-close-button"
              >
                <X size={20} className="text-gray-400" />
              </button>
            )}
          </div>

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

          <div
            className="flex-1 overflow-y-auto px-6 py-5"
            style={{ maxHeight: "70vh" }}
          >
            {step === "form" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                  <p className="text-sm text-gray-700">
                    Grave um áudio para seu lembrete.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600">
                    Descrição{" "}
                    <span className="font-normal text-gray-400">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que deve ser lembrado..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]"
                    data-tracking-id="new-reminder-start-recording-button"
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
                  <p className="mt-2 text-sm text-gray-500">
                    Gravando áudio...
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white transition-colors hover:bg-red-700"
                    data-tracking-id="new-reminder-stop-recording-button"
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
                        enviar. O lembrete será criado e a gravação vinculada.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleRetryRecording}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    data-tracking-id="new-reminder-retry-recording-button"
                  >
                    <RefreshCw size={16} />
                    Regravar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      recorder.mediaBlob &&
                      handleConfirmAndSend(
                        recorder.mediaBlob,
                        recorder.duration,
                      )
                    }
                    disabled={!recorder.mediaBlob}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50"
                    data-tracking-id="new-reminder-confirm-and-send-button"
                  >
                    <Send size={16} />
                    Confirmar e Enviar
                  </button>
                </div>
              </>
            )}

            {step === "saving" && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-5 text-base font-semibold text-gray-800">
                  Salvando lembrete e gravação...
                </p>
                <p className="mt-1.5 text-center text-sm text-gray-500">
                  Aguarde enquanto preparamos seu lembrete
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
