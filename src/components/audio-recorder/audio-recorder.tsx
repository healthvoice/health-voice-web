import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Mic,
  Pause,
  Pen,
  RefreshCw,
  Send,
  TriangleAlert,
  UserPlus,
  Video,
  Volume2,
  X,
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/blocks/dropdown-menu";
import { CreateClientSheet } from "../ui/create-client-sheet";
import { useMediaRecorder } from "./use-media-recorder";
import { useRecordingFlow } from "./use-recording-flow";
import { useRecordingUpload } from "./use-recording-upload";

// Função para derivar o tipo de mídia
const getMediaTypeFromMetadata = (metadata: {
  recordingType: string;
  consultationType: string | null;
}): "audio" | "video" => {
  return metadata.recordingType === "CLIENT" &&
    metadata.consultationType === "ONLINE"
    ? "video"
    : "audio";
};

interface AudioRecorderProps {
  buttonClassName: string;
  skipToClient?: boolean;
}

export function AudioRecorder({
  buttonClassName,
  skipToClient,
}: AudioRecorderProps) {
  const { GetRecordings, clients, selectedClient } = useGeneralContext();
  const { PostAPI } = useApiContext();
  const { uploadMedia, formatDurationForAPI } = useRecordingUpload();
  const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  // 1. Declarar o recorder (passando uma função vazia ou null no onReset)
  // Como useMediaRecorder não depende de nada do useRecordingFlow,
  // podemos declará-lo antes, usando um valor de placeholder para o mediaType inicial.
  // NO ENTANTO, para manter a lógica de mediaType derivado, vamos usar o padrão de useRef para onReset.

  // --- Ajuste para resolver o Block-scoped variable error ---
  // A função resetFlow (dentro de useRecordingFlow) PRECISA da função resetRecording (dentro de recorder).
  // 1. Declaramos uma função de reset de placeholder.
  // 2. Passamos o placeholder para useRecordingFlow.
  // 3. Declaramos o recorder.
  // 4. Atualizamos o placeholder para a função real do recorder.

  const resetRecorderRef = useRef(() => {}); // Placeholder para recorder.resetRecording

  const {
    currentStep,
    setCurrentStep,
    metadata,
    updateMetadata,
    error,
    setError,
    validateForm,
    resetFlow,
    openSaveDialog,
  } = useRecordingFlow(resetRecorderRef.current); // ← Passando o placeholder

  // NOVO: Derivando o tipo de mídia, agora que 'metadata' está disponível
  const currentMediaType = getMediaTypeFromMetadata(metadata);

  const recorder = useMediaRecorder({
    mediaType: currentMediaType, // ← USANDO O TIPO DERIVADO
    onComplete: undefined,
    onError: (error) => {
      setError(error.message);
      setCurrentStep("idle");
    },
  });

  // O Efeito colateral: Atualizar a referência com a função real do recorder
  // para que resetFlow use a função correta. Isso é seguro porque recorder é
  // estável (useMediaRecorder retorna um objeto estável com useCallback dentro).
  useEffect(() => {
    resetRecorderRef.current = recorder.resetRecording;
  }, [recorder.resetRecording]);
  // -------------------------------------------------------------

  // MODIFICADO: Recebe o finalMediaType como parâmetro
  const handleRecordingComplete = async (
    blob: Blob,
    duration: number,
    finalMediaType: "audio" | "video",
  ) => {
    try {
      setCurrentStep("processing");

      const uploadedUrl = await uploadMedia(blob, finalMediaType); // Usa finalMediaType

      const payload = {
        name: metadata.name.trim() || getDerivedTitle(),
        description: metadata.description || getDerivedDescription(),
        duration: formatDurationForAPI(duration),
        seconds: duration,
        audioUrl: uploadedUrl, // Usa finalMediaType
        type:
          metadata.recordingType === "PERSONAL"
            ? metadata.personalRecordingType
            : "CLIENT",
        ...(metadata.selectedClientId
          ? { clientId: metadata.selectedClientId }
          : {}),
      };

      console.log("payload", payload);
      const response = await PostAPI("/recording", payload, true);
      console.log("response", response);

      if (response?.status >= 400) {
        throw new Error("Erro ao salvar gravação");
      }

      toast.success("Gravação salva com sucesso!");

      GetRecordings();

      resetFlow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let errorMessage = "Erro ao salvar gravação. Tente novamente.";
      if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setCurrentStep("preview"); // Return to preview to allow retry
      // DO NOT call resetFlow() - keep the modal open with the recording
    }
  };

  useEffect(() => {
    if (
      recorder.mediaBlob &&
      !recorder.isRecording &&
      currentStep === "recording"
    ) {
      setCurrentStep("preview");
    }
  }, [recorder.mediaBlob, recorder.isRecording, currentStep]);

  useEffect(() => {
    // CORRIGIDO: Usa currentMediaType
    if (currentStep === "preview" && recorder.mediaUrl) {
      if (currentMediaType === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.src = recorder.mediaUrl;
        videoPreviewRef.current.load();
      } else if (currentMediaType === "audio" && audioPreviewRef.current) {
        audioPreviewRef.current.src = recorder.mediaUrl;
        audioPreviewRef.current.load();
      }
    }
  }, [currentStep, recorder.mediaUrl, currentMediaType]); // ← ADICIONA currentMediaType como dependência

  const handleDropdownOpenChange = (open: boolean) => {
    if (open && skipToClient) {
      // Se está tentando abrir E skipToClient é true, abre direto o save dialog
      openSaveDialog("CLIENT");
    } else {
      // Caso contrário, comportamento normal do dropdown
      setIsDropdownOpen(open);
    }
  };

  const getDerivedTitle = () => {
    if (metadata.name) return metadata.name;

    if (metadata.recordingType === "CLIENT") {
      return "Gravação do Paciente";
    } else {
      const labels = {
        REMINDER: "Lembrete",
        STUDY: "Estudo",
        OTHER: "Gravação",
      };
      return labels[metadata.personalRecordingType!] || "Gravação Pessoal";
    }
  };

  const getDerivedDescription = () => {
    if (metadata.description) return metadata.description;

    const date = moment().format("DD/MM/YYYY HH:mm:ss");

    if (metadata.recordingType === "CLIENT") {
      const type =
        metadata.consultationType === "IN_PERSON" ? "presencial" : "online";
      return `Consulta ${type} realizada em ${date}`;
    } else {
      const labels = {
        REMINDER: "Gravação de lembrete",
        STUDY: "Gravação de estudo",
        OTHER: "Gravação pessoal",
      };
      return (
        labels[metadata.personalRecordingType!] ||
        `Gravação pessoal realizada em ${date}`
      );
    }
  };

  const handleStartRecording = async () => {
    if (!validateForm()) return;

    // A lógica de setMediaType foi removida.
    // O tipo de gravação é determinado por currentMediaType.

    if (currentMediaType === "video") {
      // Usa currentMediaType
      setCurrentStep("instructions");
    } else {
      try {
        setCurrentStep("recording");
        await recorder.startRecording();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        let errorMessage = "Erro ao iniciar gravação";

        if (error.name === "NotAllowedError") {
          errorMessage = "Permissão negada. Permita o acesso ao microfone.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Nenhum microfone encontrado.";
        } else if (error.message) {
          errorMessage = error.message; // Custom error messages
        }

        setError(errorMessage);
        setCurrentStep("save-dialog");
      }
    }
  };

  const handleStartVideoRecording = async () => {
    try {
      setCurrentStep("recording");
      await recorder.startRecording();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let errorMessage = "Erro ao iniciar gravação de vídeo";

      if (error.name === "NotAllowedError") {
        errorMessage = "Permissão negada. Permita o compartilhamento de tela.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setCurrentStep("save-dialog");
    }
  };

  // CORRIGIDO: Passa currentMediaType para handleRecordingComplete
  const handleConfirmRecording = () => {
    if (recorder.mediaBlob) {
      handleRecordingComplete(
        recorder.mediaBlob,
        recorder.duration,
        currentMediaType,
      );
    }
  };

  const handleRetryRecording = () => {
    recorder.resetRecording();
    setCurrentStep("save-dialog");
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    resetFlow();
  }, []);

  useEffect(() => {
    const isSheetOpen = currentStep !== "idle";
    const body = document.body;

    if (isSheetOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }

    return () => {
      body.classList.remove("no-scroll");
    };
  }, [currentStep]);

  useEffect(() => {
    if (skipToClient) {
      updateMetadata({ ...metadata, selectedClientId: selectedClient?.id });
    }
  }, [skipToClient]);

  return (
    <>
      {currentStep === "idle" && (
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={handleDropdownOpenChange}
        >
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 rounded-3xl px-4 py-2 transition",
                buttonClassName,
              )}
            >
              <Mic size={20} />
              Nova Gravação
              <ChevronDown size={20} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => openSaveDialog("CLIENT")}>
              <div className="flex items-center gap-2">
                <Video size={18} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-800">Consulta</p>
                  <p className="text-xs text-gray-500">Presencial ou Online</p>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openSaveDialog("PERSONAL")}>
              <div className="flex items-center gap-2">
                <Mic size={18} className="text-green-600" />
                <div>
                  <p className="font-semibold text-gray-800">Pessoal</p>
                  <p className="text-xs text-gray-500">
                    Lembretes, estudos, etc.
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {mounted &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (currentStep === "recording") return;
                resetFlow();
              }
            }}
            className={cn(
              "bg-opacity-50 fixed inset-0 z-[99999] flex items-end justify-center bg-black/20 backdrop-blur-xs",
              currentStep === "idle" && "hidden",
            )}
          >
            {currentStep === "save-dialog" && (
              <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {metadata.recordingType === "CLIENT"
                      ? "Nova Consulta"
                      : "Nova Gravação Pessoal"}
                  </h2>
                  <button
                    onClick={resetFlow}
                    className="text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertCircle
                      className="mt-0.5 flex-shrink-0 text-red-500"
                      size={20}
                    />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nome da Gravação
                    </label>
                    <input
                      type="text"
                      value={metadata.name}
                      onChange={(e) => updateMetadata({ name: e.target.value })}
                      placeholder={
                        metadata.recordingType === "CLIENT"
                          ? "Ex: Consulta - João Silva"
                          : metadata.personalRecordingType === "REMINDER"
                            ? "Ex: Lembrete - Assinar documento"
                            : metadata.personalRecordingType === "STUDY"
                              ? "Ex: Estudo - Análise de dados"
                              : "Ex: Gravação pessoal"
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descrição da Gravação
                    </label>
                    <textarea
                      value={metadata.description}
                      onChange={(e) =>
                        updateMetadata({ description: e.target.value })
                      }
                      onWheel={(e) => e.stopPropagation()}
                      placeholder="Descrição"
                      className="h-32 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-black transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {metadata.recordingType === "PERSONAL" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Tipo de Gravação
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() =>
                            updateMetadata({
                              personalRecordingType: "REMINDER",
                            })
                          }
                          className={cn(
                            "group rounded-lg border-2 p-4 transition-all",
                            metadata.personalRecordingType === "REMINDER"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-blue-600 hover:bg-blue-50",
                          )}
                        >
                          <Lightbulb
                            size={24}
                            className={cn(
                              "mx-auto mb-2 transition-colors",
                              metadata.personalRecordingType === "REMINDER"
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-blue-600",
                            )}
                          />
                          <p
                            className={cn(
                              "font-semibold transition-colors",
                              metadata.personalRecordingType === "REMINDER"
                                ? "text-blue-600"
                                : "text-gray-800 group-hover:text-blue-600",
                            )}
                          >
                            Lembrete
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Apenas áudio
                          </p>
                        </button>
                        <button
                          onClick={() =>
                            updateMetadata({ personalRecordingType: "STUDY" })
                          }
                          className={cn(
                            "group rounded-lg border-2 p-4 transition-all",
                            metadata.personalRecordingType === "STUDY"
                              ? "border-blue-600 bg-blue-50" // Mantendo a cor selecionada como azul (padrão do sistema) ou você quer verde? O user pediu hover. Vou manter selecionado como azul para consistência, mas o hover verde.
                              : "border-gray-300 hover:border-green-600 hover:bg-green-50",
                          )}
                        >
                          <Pen
                            size={24}
                            className={cn(
                              "mx-auto mb-2 transition-colors",
                              metadata.personalRecordingType === "STUDY"
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-green-600",
                            )}
                          />
                          <p
                            className={cn(
                              "font-semibold transition-colors",
                              metadata.personalRecordingType === "STUDY"
                                ? "text-blue-600"
                                : "text-gray-800 group-hover:text-green-600",
                            )}
                          >
                            Estudos
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Apenas áudio
                          </p>
                        </button>
                        <button
                          onClick={() =>
                            updateMetadata({ personalRecordingType: "OTHER" })
                          }
                          className={cn(
                            "group rounded-lg border-2 p-4 transition-all",
                            metadata.personalRecordingType === "OTHER"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-orange-600 hover:bg-orange-50",
                          )}
                        >
                          <TriangleAlert
                            size={24}
                            className={cn(
                              "mx-auto mb-2 transition-colors",
                              metadata.personalRecordingType === "OTHER"
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-orange-600",
                            )}
                          />
                          <p
                            className={cn(
                              "font-semibold transition-colors",
                              metadata.personalRecordingType === "OTHER"
                                ? "text-blue-600"
                                : "text-gray-800 group-hover:text-orange-600",
                            )}
                          >
                            Outro
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Apenas áudio
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {metadata.recordingType === "CLIENT" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Tipo de Consulta
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() =>
                            updateMetadata({ consultationType: "IN_PERSON" })
                          }
                          className={cn(
                            "group rounded-lg border-2 p-4 transition-all",
                            metadata.consultationType === "IN_PERSON"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-blue-600 hover:bg-blue-50",
                          )}
                        >
                          <Mic
                            size={24}
                            className={cn(
                              "mx-auto mb-2 transition-colors",
                              metadata.consultationType === "IN_PERSON"
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-blue-600",
                            )}
                          />
                          <p
                            className={cn(
                              "font-semibold transition-colors",
                              metadata.consultationType === "IN_PERSON"
                                ? "text-blue-600"
                                : "text-gray-800 group-hover:text-blue-600",
                            )}
                          >
                            Presencial
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Apenas áudio
                          </p>
                        </button>

                        <button
                          onClick={() =>
                            updateMetadata({ consultationType: "ONLINE" })
                          }
                          className={cn(
                            "group w-full flex-1 rounded-lg border-2 p-4 transition-all",
                            metadata.consultationType === "ONLINE"
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-blue-600 hover:bg-blue-50",
                          )}
                        >
                          <Video
                            size={24}
                            className={cn(
                              "mx-auto mb-2 transition-colors",
                              metadata.consultationType === "ONLINE"
                                ? "text-blue-600"
                                : "text-gray-600 group-hover:text-blue-600",
                            )}
                          />
                          <p
                            className={cn(
                              "font-semibold transition-colors",
                              metadata.consultationType === "ONLINE"
                                ? "text-blue-600"
                                : "text-gray-800 group-hover:text-blue-600",
                            )}
                          >
                            Online
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Vídeo + áudio
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {metadata.recordingType === "CLIENT" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Selecionar Paciente
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-3">
                            <input
                              type="text"
                              value={
                                metadata.selectedClientId
                                  ? clients.find(
                                      (c) => c.id === metadata.selectedClientId,
                                    )?.name
                                  : "Selecione um Paciente"
                              }
                              className="w-full cursor-pointer text-black outline-none"
                              required
                              readOnly
                            />
                            <ChevronDown size={20} className="text-gray-600" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="top"
                          className="z-[9999] h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-scroll"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onSelect={() => setIsCreateClientSheetOpen(true)}
                            className="sticky top-0 z-10 mb-2 flex items-center justify-start gap-2 border-b border-gray-100 bg-white py-3 font-semibold text-blue-600 hover:bg-neutral-50"
                          >
                            <UserPlus size={16} />
                            Cadastrar Novo Paciente
                          </DropdownMenuItem>
                          {clients.length !== 0 ? (
                            clients.map((client) => (
                              <DropdownMenuItem
                                key={client.id}
                                className={cn(
                                  "hover:bg-neutral-200",
                                  metadata.selectedClientId === client.id
                                    ? "bg-neutral-200"
                                    : "",
                                )}
                                onClick={() =>
                                  updateMetadata({
                                    selectedClientId: client.id,
                                  })
                                }
                              >
                                {client.name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                              Nenhum paciente encontrado.
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <button
                    onClick={handleStartRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    {currentMediaType === "video" ? ( // Usa currentMediaType
                      <>
                        <Video size={20} />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Mic size={20} />
                        Iniciar Gravação
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === "instructions" && (
              <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Instruções
                  </h2>
                  <button
                    onClick={resetFlow}
                    className="text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-900">
                      <AlertCircle size={20} />
                      Instruções Importantes
                    </h3>
                    <ol className="space-y-3 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <span className="min-w-[24px] font-bold">1.</span>
                        <span>
                          Na próxima tela, selecione a{" "}
                          <strong>ABA do Google Meet</strong> (não a janela
                          inteira)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="min-w-[24px] font-bold">2.</span>
                        <span>
                          Certifique-se de{" "}
                          <strong>
                            marcar a opção {"'"}Compartilhar áudio da aba{"'"}
                          </strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="min-w-[24px] font-bold">3.</span>
                        <span>
                          Clique em{" "}
                          <strong>
                            {"'"}Compartilhar{"'"}
                          </strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="min-w-[24px] font-bold">4.</span>
                        <span>
                          A gravação iniciará automaticamente e capturará vídeo
                          + áudio da reunião
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-2 text-sm text-green-800">
                      <CheckCircle2
                        size={20}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <p>
                        <strong>Dica:</strong> O áudio do seu microfone também
                        será capturado automaticamente para registrar suas
                        observações durante a consulta.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep("save-dialog")}
                      className="flex-1 rounded-lg bg-gray-200 py-4 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleStartVideoRecording}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Video size={20} />
                      Iniciar Gravação
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "recording" && (
              <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Gravando...
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative">
                      <div className="bg-primary flex h-24 w-24 animate-pulse items-center justify-center rounded-full">
                        {metadata.consultationType === "ONLINE" ? (
                          <Video size={40} className="text-white" />
                        ) : (
                          <Mic size={40} className="text-white" />
                        )}
                      </div>
                      <div className="bg-primary absolute -top-1 -right-1 h-6 w-6 animate-ping rounded-full" />
                    </div>

                    <p className="mt-6 text-3xl font-bold text-gray-800">
                      {formatDuration(recorder.duration)}
                    </p>

                    <p className="mt-2 text-gray-600">
                      {metadata.consultationType === "ONLINE"
                        ? "Gravando vídeo e áudio..."
                        : "Gravando áudio..."}
                    </p>
                  </div>

                  {metadata.consultationType === "ONLINE" && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-center text-sm text-yellow-800">
                        Para parar a gravação, clique em {"'"}Parar
                        compartilhamento
                        {"'"} na barra do navegador ou no botão abaixo
                      </p>
                    </div>
                  )}

                  <button
                    onClick={recorder.stopRecording}
                    className="bg-primary flex w-full items-center justify-center gap-2 rounded-lg py-4 font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    <Pause size={20} />
                    Parar Gravação
                  </button>
                </div>
              </div>
            )}

            {currentStep === "preview" && (
              <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Revisar Gravação
                  </h2>
                  <button
                    onClick={resetFlow}
                    className="text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {currentMediaType === "video" && ( // Usa currentMediaType
                    <div className="overflow-hidden rounded-lg bg-black">
                      <video
                        ref={videoPreviewRef}
                        controls
                        className="w-full"
                        style={{ maxHeight: "400px" }}
                      >
                        Seu navegador não suporta o elemento de vídeo.
                      </video>
                    </div>
                  )}

                  {currentMediaType === "audio" && ( // Usa currentMediaType
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <Volume2 size={40} className="text-blue-600" />
                      </div>
                      <audio
                        ref={audioPreviewRef}
                        controls
                        className="w-full max-w-md"
                      >
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-600">Duração</p>
                        <p className="text-lg font-bold text-gray-800">
                          {formatDuration(recorder.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Tipo</p>
                        <p className="text-lg font-bold text-gray-800">
                          {currentMediaType === "video"
                            ? "Vídeo + Áudio"
                            : "Áudio"}{" "}
                          {/* Usa currentMediaType */}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2 text-sm text-blue-800">
                      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Valide sua gravação</p>
                        <p className="mt-1">
                          {currentMediaType === "video"
                            ? "Reproduza o vídeo e verifique se o áudio e vídeo estão sincronizados e com boa qualidade."
                            : "Reproduza o áudio e verifique se está audível e com boa qualidade."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRetryRecording}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-200 py-4 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      <RefreshCw size={20} />
                      Gravar Novamente
                    </button>
                    <button
                      onClick={handleConfirmRecording}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-4 font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      <Send size={20} />
                      Confirmar e Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "processing" && (
              <div className="animate-slide-up w-full max-w-2xl rounded-t-3xl bg-white p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  <p className="mt-6 text-lg font-semibold text-gray-800">
                    Processando gravação...
                  </p>
                  <p className="mt-2 text-center text-gray-600">
                    Aguarde enquanto preparamos sua gravação para transcrição
                  </p>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}

      {isCreateClientSheetOpen && (
        <CreateClientSheet
          isOpen={isCreateClientSheetOpen}
          onClose={() => setIsCreateClientSheetOpen(false)}
          className="text-black"
        />
      )}
    </>
  );
}
