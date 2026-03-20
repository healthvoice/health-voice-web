import { ClientProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import {
  setTourFinalStepPending,
  useRecordingTour,
} from "@/context/RecordingTourContext";
import { trackAction, UserActionType } from "@/services/actionTrackingService";
import { cn } from "@/utils/cn";
import { handleApiError } from "@/utils/error-handler";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Loader2,
  Mic,
  Pause,
  Pen,
  RefreshCw,
  Search,
  Send,
  TriangleAlert,
  UserPlus,
  Video,
  Volume2,
  X,
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/blocks/dropdown-menu";
import { useMediaRecorder } from "./use-media-recorder";
import { useRecordingFlow, type RecordingStep } from "./use-recording-flow";
import { useRecordingUpload } from "./use-recording-upload";

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
  customLabel?: string;
  customIcon?: React.ComponentType<{ className?: string }>;
  initialClientId?: string;
  initialReminderId?: string;
  forcePersonalType?: "REMINDER" | "STUDY" | "OTHER";
  skipNewRecordingRequest?: boolean;
  /** Quando definido, renderiza um único botão que abre direto Consulta (CLIENT) ou Pessoal (PERSONAL), sem dropdown */
  forceType?: "CLIENT" | "PERSONAL";
  /** Texto secundário exibido dentro do botão (ex.: "Lembretes, estudos, outros") */
  customSubtitle?: string;
}

export function AudioRecorder({
  buttonClassName,
  skipToClient,
  customLabel,
  customIcon: CustomIcon,
  initialClientId,
  initialReminderId,
  forcePersonalType,
  skipNewRecordingRequest = false,
  forceType,
  customSubtitle,
}: AudioRecorderProps) {
  const {
    GetRecordings,
    GetReminders,
    clients,
    selectedClient,
    newRecordingRequest,
    resetNewRecordingRequest,
    GetClients,
    setClients,
  } = useGeneralContext();
  const { PostAPI } = useApiContext();
  const router = useRouter();
  const {
    isTourActive,
    startTour,
    advanceToNextStep,
    shouldRunTour,
    getActiveIndex,
    driverRef,
    registerValidateAdvanceFromPatientStep,
  } = useRecordingTour();
  const tourAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTourStepRef = useRef<string>("");
  const { uploadMedia, formatDurationForAPI } = useRecordingUpload();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Image Carousel State (for save-dialog left panel)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselImages = [
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1920&auto=format&fit=crop",
  ];
  const [tempCreatedClient, setTempCreatedClient] =
    useState<ClientProps | null>(null);
  const [pendingClientName, setPendingClientName] = useState<string | null>(
    null,
  );
  const resetRecorderRef = useRef(() => {});
  const modalSourceRef = useRef<string | null>(null);
  const previousStepRef = useRef<RecordingStep | "idle">("idle");
  const recordingCompletedRef = useRef(false);

  // Inline patient creation states
  const [patientSearch, setPatientSearch] = useState("");
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientDescription, setNewPatientDescription] = useState("");
  const [newPatientBirthDate, setNewPatientBirthDate] = useState("");
  const [isCreatingPatientLoading, setIsCreatingPatientLoading] =
    useState(false);

  /** Modo simplificado: lembrete (só botão) ou personal (só Estudos/Outros). Usa o mesmo layout da nova gravação (carrossel + stepper). */
  const [simplifiedDialogMode, setSimplifiedDialogMode] = useState<
    "lembrete" | "personal" | null
  >(null);

  const {
    currentStep,
    setCurrentStep,
    metadata,
    updateMetadata,
    error,
    setError,
    validateForm,
    resetFlow: originalResetFlow,
    openSaveDialog,
  } = useRecordingFlow(resetRecorderRef.current);

  useEffect(() => {
    if (pendingClientName && clients.length > 0) {
      const found = clients.find((c) => c.name === pendingClientName);
      if (found) {
        updateMetadata({ selectedClientId: found.id });
        setPendingClientName(null);
        setTempCreatedClient(null);
      }
    }
  }, [clients, pendingClientName, updateMetadata]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desabilita o scroll do site quando a modal do gravador estiver aberta (fundo fixo)
  useEffect(() => {
    const isModalOpen = currentStep !== "idle";
    if (isModalOpen) {
      const scrollY = window.scrollY;
      const html = document.documentElement;
      const body = document.body;
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyOverflow = body.style.overflow;
      const prevBodyPosition = body.style.position;
      const prevBodyTop = body.style.top;
      const prevBodyLeft = body.style.left;
      const prevBodyRight = body.style.right;
      const prevBodyWidth = body.style.width;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      return () => {
        html.style.overflow = prevHtmlOverflow;
        body.style.overflow = prevBodyOverflow;
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.left = prevBodyLeft;
        body.style.right = prevBodyRight;
        body.style.width = prevBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [currentStep]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const currentMediaType = getMediaTypeFromMetadata(metadata);

  const recorder = useMediaRecorder({
    mediaType: currentMediaType,
    onComplete: undefined,
    onError: (error) => {
      setError(error.message);
      setCurrentStep("idle");
    },
  });

  useEffect(() => {
    resetRecorderRef.current = recorder.resetRecording;
  }, [recorder.resetRecording]);

  const resetFlow = useCallback((skipCancelledTracking = false) => {
    const hasPendingRecording =
      recorder.mediaBlob &&
      (currentStep === "preview" ||
        currentStep === "save-dialog" ||
        currentStep === "recording");

    // Só dispara RECORDING_CANCELLED se:
    // 1. Há uma gravação pendente
    // 2. Não foi marcado como completado
    // 3. Não foi solicitado para pular o tracking de cancelamento
    if (hasPendingRecording && !recordingCompletedRef.current && !skipCancelledTracking) {
      trackAction(
        {
          actionType: UserActionType.RECORDING_CANCELLED,
          metadata: {
            recordingType: metadata.recordingType,
            consultationType: metadata.consultationType,
            personalRecordingType: metadata.personalRecordingType,
            duration: recorder.duration,
            hadBlob: !!recorder.mediaBlob,
            step: currentStep,
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar tracking de cancelamento:", error);
      });
    }

    // Reset do flag de completado
    recordingCompletedRef.current = false;

    // Tracking: MODAL_CLOSED quando a modal é fechada via resetFlow
    if (currentStep !== "idle") {
      const modalId = metadata.recordingType === "CLIENT" 
        ? "new-consultation-modal"
        : simplifiedDialogMode === "lembrete"
        ? "new-reminder-modal"
        : "new-personal-recording-modal";

      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata: {
            modalId,
            source: modalSourceRef.current || "unknown",
            reason: hasPendingRecording ? "cancelled" : "dismissed",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_CLOSED:", error);
      });
    }

    // Reset inline patient states
    setPatientSearch("");
    setIsCreatingPatient(false);
    setNewPatientName("");
    setNewPatientDescription("");
    setNewPatientBirthDate("");
    setSimplifiedDialogMode(null);
    modalSourceRef.current = null;

    originalResetFlow();
  }, [
    recorder.mediaBlob,
    recorder.duration,
    currentStep,
    metadata,
    simplifiedDialogMode,
    PostAPI,
    originalResetFlow,
  ]);

  const handleRecordingComplete = async (
    blob: Blob,
    duration: number,
    finalMediaType: "audio" | "video",
  ) => {
    try {
      setCurrentStep("processing");

      const uploadedUrl = await uploadMedia(blob, finalMediaType);

      const payload = {
        name: metadata.name.trim() || getDerivedTitle(),
        description: metadata.description || getDerivedDescription(),
        duration: formatDurationForAPI(duration),
        seconds: duration,
        audioUrl: uploadedUrl,
        type:
          metadata.recordingType === "PERSONAL"
            ? metadata.personalRecordingType
            : "CLIENT",
        ...(metadata.selectedClientId
          ? { clientId: metadata.selectedClientId }
          : {}),
        ...(metadata.personalRecordingType === "REMINDER" && initialReminderId
          ? { reminderId: initialReminderId }
          : {}),
      };

      const response = await PostAPI("/recording", payload, true);

      if (response?.status >= 400) {
        const errorMessage = handleApiError(
          response,
          "Erro ao salvar gravação. Tente novamente.",
        );
        setError(errorMessage);
        toast.error(errorMessage);
        setCurrentStep("preview");
        return;
      }

      toast.success("Gravação salva com sucesso!");

      // Tracking: RECORDING_COMPLETED quando a gravação é salva com sucesso
      const modalId = metadata.recordingType === "CLIENT" 
        ? "new-consultation-modal"
        : simplifiedDialogMode === "lembrete"
        ? "new-reminder-modal"
        : "new-personal-recording-modal";

      trackAction(
        {
          actionType: UserActionType.RECORDING_COMPLETED,
          metadata: {
            modalId,
            source: modalSourceRef.current || "unknown",
            recordingType: metadata.recordingType,
            consultationType: metadata.consultationType,
            personalRecordingType: metadata.personalRecordingType,
            clientId: metadata.selectedClientId || undefined,
            duration,
            seconds: duration,
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar RECORDING_COMPLETED:", error);
      });

      // Marcar como completado para evitar RECORDING_CANCELLED no resetFlow
      recordingCompletedRef.current = true;

      GetRecordings();
      if (metadata.personalRecordingType === "REMINDER" && initialReminderId) {
        GetReminders();
      }

      if (isTourActive) {
        setTourFinalStepPending();
        router.push("/recordings");
      }
      resetFlow(true); // Passar true para pular o tracking de cancelamento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error.message || "Erro ao salvar gravação. Tente novamente.";
      setError(errorMessage);
      toast.error(errorMessage);
      setCurrentStep("preview");
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

  // Tour: ao abrir o form de criação inline (step 3 → 4), avança para "Nome do paciente"
  useEffect(() => {
    if (!isTourActive || !isCreatingPatient) return;
    const active = getActiveIndex();
    if (active !== 3) return;
    const t = setTimeout(() => {
      advanceToNextStep();
      setTimeout(() => {
        driverRef.current?.refresh();
        setTimeout(() => driverRef.current?.refresh(), 400);
      }, 300);
    }, 400);
    return () => clearTimeout(t);
  }, [
    isCreatingPatient,
    isTourActive,
    getActiveIndex,
    advanceToNextStep,
    driverRef,
  ]);

  // Tour: avançar para o step correto ao mudar de tela
  useEffect(() => {
    if (!isTourActive) return;
    if (
      currentStep === "instructions" &&
      lastTourStepRef.current !== "instructions"
    ) {
      lastTourStepRef.current = "instructions";
      // Aguarda o browser pintar o layout novo (instructions é 1 coluna, save-dialog era 2 colunas)
      // e só então avança o tour + faz refreshes agressivos para reposicionar o popover
      setTimeout(() => {
        requestAnimationFrame(() => {
          advanceToNextStep();
          // Refreshes pós-avanço para garantir que o popover se reposicione após o layout estabilizar
          setTimeout(() => driverRef.current?.refresh(), 50);
          setTimeout(() => driverRef.current?.refresh(), 200);
          setTimeout(() => driverRef.current?.refresh(), 500);
          setTimeout(() => driverRef.current?.refresh(), 900);
        });
      }, 400);
    }
    if (
      currentStep === "recording" &&
      lastTourStepRef.current !== "recording"
    ) {
      lastTourStepRef.current = "recording";
      // Só avança se ainda estiver no passo 8 (Iniciar gravação); o contexto já avança 8→9 ao clicar
      if (getActiveIndex() === 8) {
        setTimeout(() => advanceToNextStep(), 400);
      }
    }
    if (currentStep === "preview" && lastTourStepRef.current !== "preview") {
      lastTourStepRef.current = "preview";
      setTimeout(() => advanceToNextStep(), 400);
    }
  }, [currentStep, isTourActive, advanceToNextStep, getActiveIndex]);

  // Tour: auto-stop gravação após 10 segundos
  useEffect(() => {
    if (currentStep !== "recording" || !isTourActive) {
      if (tourAutoStopRef.current) {
        clearTimeout(tourAutoStopRef.current);
        tourAutoStopRef.current = null;
      }
      return;
    }
    tourAutoStopRef.current = setTimeout(() => {
      recorder.stopRecording();
      tourAutoStopRef.current = null;
    }, 10000);
    return () => {
      if (tourAutoStopRef.current) {
        clearTimeout(tourAutoStopRef.current);
        tourAutoStopRef.current = null;
      }
    };
  }, [currentStep, isTourActive, recorder]);

  useEffect(() => {
    if (currentStep === "preview" && recorder.mediaUrl) {
      if (currentMediaType === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.src = recorder.mediaUrl;
        videoPreviewRef.current.load();
      } else if (currentMediaType === "audio" && audioPreviewRef.current) {
        audioPreviewRef.current.src = recorder.mediaUrl;
        audioPreviewRef.current.load();
      }
    }
  }, [currentStep, recorder.mediaUrl, currentMediaType]);

  const handleDropdownOpenChange = (open: boolean) => {
    if (open && (skipToClient || forceType === "CLIENT")) {
      openSaveDialog("CLIENT");
      // Tour passo 0 → 1: sidebar usa forceType="CLIENT", então precisamos avançar aqui
      if (isTourActive && getActiveIndex() === 0) {
        updateMetadata({ consultationType: "ONLINE" });
        // Atrasa para o modal abrir; depois refresh em dois momentos para o popover não bugar no canto
        setTimeout(() => {
          advanceToNextStep();
          setTimeout(() => {
            driverRef.current?.refresh();
            setTimeout(() => driverRef.current?.refresh(), 500);
          }, 400);
        }, 550);
      }
    } else if (open && initialReminderId) {
      openSaveDialog("PERSONAL", "REMINDER");
    } else if (open && forceType === "PERSONAL") {
      openSaveDialog("PERSONAL");
    } else {
      setIsDropdownOpen(open);
      if (open && !skipToClient && !initialReminderId && !forceType) {
        if (isTourActive && getActiveIndex() === 0) {
          // Abre o modal de gravação (Consulta) para que o passo seguinte (Nome da gravação) exista no DOM
          setIsDropdownOpen(false);
          openSaveDialog("CLIENT");
          updateMetadata({ consultationType: "ONLINE" });
          setTimeout(() => {
            advanceToNextStep();
            setTimeout(() => {
              driverRef.current?.refresh();
              setTimeout(() => driverRef.current?.refresh(), 500);
            }, 400);
          }, 550);
        } else if (!isTourActive && shouldRunTour()) {
          startTour(1);
        }
      }
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
    setSimplifiedDialogMode(null);
    
    // Tracking: RECORDING_STARTED com metadata da modal
    const modalId = metadata.recordingType === "CLIENT" 
      ? "new-consultation-modal"
      : simplifiedDialogMode === "lembrete"
      ? "new-reminder-modal"
      : "new-personal-recording-modal";

    trackAction(
      {
        actionType: UserActionType.RECORDING_STARTED,
        metadata: {
          modalId,
          source: modalSourceRef.current || "unknown",
          recordingType: metadata.recordingType,
          consultationType: metadata.consultationType,
          personalRecordingType: metadata.personalRecordingType,
          clientId: metadata.selectedClientId || undefined,
        },
      },
      PostAPI,
    ).catch((error) => {
      console.warn("Erro ao registrar RECORDING_STARTED:", error);
    });

    if (currentMediaType === "video") {
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
          errorMessage = error.message;
        }
        setError(errorMessage);
        setCurrentStep("save-dialog");
        // Tour: voltar para o passo do botão "Continuar" para o usuário tentar novamente
        if (isTourActive && driverRef.current) {
          lastTourStepRef.current = "";
          setTimeout(() => {
            driverRef.current?.moveTo(6);
            setTimeout(() => driverRef.current?.refresh(), 300);
            setTimeout(() => driverRef.current?.refresh(), 700);
          }, 400);
        }
      }
    }
  };

  const handleStartVideoRecording = async () => {
    // Tracking: RECORDING_STARTED para vídeo
    const modalId = metadata.recordingType === "CLIENT" 
      ? "new-consultation-modal"
      : simplifiedDialogMode === "lembrete"
      ? "new-reminder-modal"
      : "new-personal-recording-modal";

    trackAction(
      {
        actionType: UserActionType.RECORDING_STARTED,
        metadata: {
          modalId,
          source: modalSourceRef.current || "unknown",
          recordingType: metadata.recordingType,
          consultationType: metadata.consultationType,
          personalRecordingType: metadata.personalRecordingType,
          clientId: metadata.selectedClientId || undefined,
        },
      },
      PostAPI,
    ).catch((error) => {
      console.warn("Erro ao registrar RECORDING_STARTED:", error);
    });

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
      // Tour: voltar para o passo do botão "Continuar" para o usuário tentar novamente
      if (isTourActive && driverRef.current) {
        lastTourStepRef.current = "";
        setTimeout(() => {
          driverRef.current?.moveTo(6);
          setTimeout(() => driverRef.current?.refresh(), 300);
          setTimeout(() => driverRef.current?.refresh(), 700);
        }, 400);
      }
    }
  };

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
    // Tracking: RECORDING_CANCELLED quando o usuário escolhe regravar
    const modalId = metadata.recordingType === "CLIENT" 
      ? "new-consultation-modal"
      : simplifiedDialogMode === "lembrete"
      ? "new-reminder-modal"
      : "new-personal-recording-modal";

    trackAction(
      {
        actionType: UserActionType.RECORDING_CANCELLED,
        metadata: {
          modalId,
          source: modalSourceRef.current || "unknown",
          recordingType: metadata.recordingType,
          consultationType: metadata.consultationType,
          personalRecordingType: metadata.personalRecordingType,
          duration: recorder.duration,
          hadBlob: !!recorder.mediaBlob,
          step: currentStep,
          reason: "retry",
        },
      },
      PostAPI,
    ).catch((error) => {
      console.warn("Erro ao registrar RECORDING_CANCELLED (retry):", error);
    });

    recorder.resetRecording();
    setCurrentStep("save-dialog");
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Inline patient creation handler
  const handleInlineCreatePatient = async () => {
    if (!newPatientName.trim() || newPatientName.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      return;
    }
    setIsCreatingPatientLoading(true);
    try {
      const data = await PostAPI(
        "/client",
        {
          name: newPatientName.trim(),
          description: newPatientDescription.trim() || null,
          birthDate: newPatientBirthDate.trim() || null,
        },
        true,
      );
      if (data.status === 200) {
        toast.success("Paciente criado com sucesso!");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawClient = (data.body.client || data.body) as any;
        const newClient = {
          ...rawClient,
          id: rawClient.id || rawClient._id,
          name: newPatientName.trim(),
        };
        setClients((prev) => [newClient, ...prev]);
        await GetClients();
        updateMetadata({ selectedClientId: newClient.id });
        setPendingClientName(newPatientName.trim());
        setTempCreatedClient(newClient);
        setNewPatientName("");
        setNewPatientDescription("");
        setNewPatientBirthDate("");
        setIsCreatingPatient(false);

        // Tracking: CLIENT_CREATED
        const modalId = metadata.recordingType === "CLIENT" 
          ? "new-consultation-modal"
          : "new-personal-recording-modal";
        
        trackAction(
          {
            actionType: UserActionType.CLIENT_CREATED,
            metadata: {
              modalId,
              clientId: newClient.id,
              source: modalSourceRef.current || "unknown",
            },
          },
          PostAPI,
        ).catch((error) => {
          console.warn("Erro ao registrar CLIENT_CREATED:", error);
        });

        if (isTourActive) {
          setTimeout(() => {
            advanceToNextStep();
            setTimeout(() => driverRef.current?.refresh(), 200);
          }, 500);
        }
      } else {
        const errorMessage = handleApiError(data, "Falha ao criar paciente.");
        toast.error(errorMessage);
      }
    } catch {
      toast.error("Erro ao criar paciente.");
    }
    setIsCreatingPatientLoading(false);
  };

  // Filtered clients for search
  const filteredClients = useMemo(() => {
    if (!patientSearch.trim()) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(patientSearch.toLowerCase()),
    );
  }, [clients, patientSearch]);

  // Step progress for the unified modal
  const stepProgress = useMemo(() => {
    const isOnline =
      metadata.recordingType === "CLIENT" &&
      metadata.consultationType === "ONLINE";
    const totalSteps = isOnline ? 4 : 3;

    const saveDialogTitle =
      simplifiedDialogMode === "lembrete"
        ? "Gravar Lembrete"
        : simplifiedDialogMode === "personal"
          ? "Gravação Pessoal"
          : metadata.recordingType === "CLIENT"
            ? "Nova Consulta"
            : "Nova Gravação";

    const configs: Record<
      string,
      { index: number; title: string; subtitle: string }
    > = {
      "save-dialog": {
        index: 0,
        title: saveDialogTitle,
        subtitle: `Passo 1 de ${totalSteps}`,
      },
      instructions: {
        index: 1,
        title: "Instruções",
        subtitle: `Passo 2 de ${totalSteps}`,
      },
      recording: {
        index: isOnline ? 2 : 1,
        title: "Gravando...",
        subtitle: `Passo ${isOnline ? 3 : 2} de ${totalSteps}`,
      },
      preview: {
        index: totalSteps - 1,
        title: "Revisar Gravação",
        subtitle: `Passo ${totalSteps} de ${totalSteps}`,
      },
      processing: {
        index: totalSteps - 1,
        title: "Processando...",
        subtitle: "Enviando gravação...",
      },
    };

    const config = configs[currentStep] || {
      index: 0,
      title: "",
      subtitle: "",
    };
    return {
      ...config,
      totalSteps,
      canClose:
        !isTourActive &&
        currentStep !== "recording" &&
        currentStep !== "processing",
    };
  }, [
    currentStep,
    metadata.recordingType,
    metadata.consultationType,
    isTourActive,
    simplifiedDialogMode,
  ]);

  useEffect(() => {
    resetFlow();
  }, []);

  // Tracking: MODAL_OPENED quando a modal é aberta
  useEffect(() => {
    if (currentStep === "save-dialog" && previousStepRef.current !== "save-dialog") {
      // Determinar source da modal
      const pathname = window.location.pathname;
      let source = "unknown";
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

      const modalId = metadata.recordingType === "CLIENT" 
        ? "new-consultation-modal"
        : simplifiedDialogMode === "lembrete"
        ? "new-reminder-modal"
        : "new-personal-recording-modal";

      trackAction(
        {
          actionType: UserActionType.MODAL_OPENED,
          metadata: {
            modalId,
            source,
            recordingType: metadata.recordingType,
            consultationType: metadata.consultationType,
            personalRecordingType: metadata.personalRecordingType,
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_OPENED:", error);
      });
    }
    previousStepRef.current = currentStep;
  }, [currentStep, metadata.recordingType, metadata.consultationType, metadata.personalRecordingType, simplifiedDialogMode, PostAPI]);

  // Tracking: MODAL_CLOSED quando a modal é fechada
  useEffect(() => {
    if (currentStep === "idle" && previousStepRef.current !== "idle") {
      const modalId = metadata.recordingType === "CLIENT" 
        ? "new-consultation-modal"
        : simplifiedDialogMode === "lembrete"
        ? "new-reminder-modal"
        : "new-personal-recording-modal";

      trackAction(
        {
          actionType: UserActionType.MODAL_CLOSED,
          metadata: {
            modalId,
            source: modalSourceRef.current || "unknown",
            reason: "dismissed",
          },
        },
        PostAPI,
      ).catch((error) => {
        console.warn("Erro ao registrar MODAL_CLOSED:", error);
      });
    }
  }, [currentStep, metadata.recordingType, simplifiedDialogMode, PostAPI]);

  useEffect(() => {
    registerValidateAdvanceFromPatientStep(() => !!metadata.selectedClientId);
  }, [metadata.selectedClientId, registerValidateAdvanceFromPatientStep]);

  useEffect(() => {
    if (
      skipNewRecordingRequest ||
      !newRecordingRequest ||
      currentStep !== "idle"
    ) {
      return;
    }
    const { type, subType, simplifiedLembrete, simplifiedPersonal } =
      newRecordingRequest;
    resetNewRecordingRequest();
    if (type === "PERSONAL" && simplifiedLembrete) {
      updateMetadata({
        recordingType: "PERSONAL",
        personalRecordingType: "REMINDER",
        consultationType: null,
      });
      setSimplifiedDialogMode("lembrete");
      setCurrentStep("save-dialog");
    } else if (type === "PERSONAL" && simplifiedPersonal) {
      updateMetadata({
        recordingType: "PERSONAL",
        personalRecordingType: null,
        consultationType: null,
      });
      setSimplifiedDialogMode("personal");
      setCurrentStep("save-dialog");
    } else if (type === "PERSONAL" && subType) {
      updateMetadata({
        recordingType: "PERSONAL",
        personalRecordingType: subType,
        consultationType: null,
      });
      setCurrentStep("save-dialog");
    } else if (type === "CLIENT") {
      openSaveDialog("CLIENT");
    }
  }, [
    newRecordingRequest,
    currentStep,
    skipNewRecordingRequest,
    resetNewRecordingRequest,
    updateMetadata,
    openSaveDialog,
  ]);

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
      const clientId = initialClientId || selectedClient?.id;
      if (clientId) {
        updateMetadata({ ...metadata, selectedClientId: clientId });
      }
    }
  }, [skipToClient, initialClientId, selectedClient?.id]);

  const renderTriggerButton = () => {
    const IconComponent = CustomIcon || Mic;
    const label = customLabel || "Nova Gravação";

    if (skipToClient || forceType === "CLIENT" || forceType === "PERSONAL") {
      const hasSubtitle = Boolean(customSubtitle?.trim());
      return (
        <div
          data-tour={
            forceType === "CLIENT" || skipToClient
              ? "nova-gravacao-trigger"
              : undefined
          }
          onClick={() => handleDropdownOpenChange(true)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl px-4 transition",
            hasSubtitle ? "py-3" : "py-2",
            buttonClassName,
          )}
        >
          <div className="flex h-9 shrink-0 items-center justify-center rounded-lg">
            <IconComponent size={18} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
            <span className="text-sm leading-tight font-semibold">{label}</span>
            {hasSubtitle && (
              <span className="text-[11px] leading-tight opacity-80">
                {customSubtitle}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (initialReminderId) {
      return (
        <div
          onClick={() => openSaveDialog("PERSONAL", "REMINDER")}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-3xl px-4 py-2 transition",
            buttonClassName,
          )}
        >
          <IconComponent size={20} />
          {label}
        </div>
      );
    }

    return (
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={handleDropdownOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <div
            data-tour="nova-gravacao-trigger"
            className={cn(
              "flex items-center gap-2 rounded-3xl px-4 py-2 transition",
              buttonClassName,
            )}
          >
            <IconComponent size={20} />
            {label}
            <ChevronDown size={20} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="z-[10050]">
          <DropdownMenuItem
            data-tour="consulta"
            onSelect={() => {
              openSaveDialog("CLIENT");
              if (isTourActive) {
                updateMetadata({ consultationType: "ONLINE" });
                setTimeout(() => advanceToNextStep(), 350);
              }
            }}
          >
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
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <>
      {currentStep === "idle" && renderTriggerButton()}

      {mounted &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (currentStep === "recording" || currentStep === "processing")
                  return;
                if (isTourActive) return;
                resetFlow();
              }
            }}
            className={cn(
              "fixed inset-0 flex items-center justify-center p-4",
              currentStep === "idle" && "hidden",
              isTourActive ? "z-[9998]" : "z-[99999]",
              "bg-black/40 backdrop-blur-sm transition-all duration-300",
            )}
          >
            {/* ── Unified Modal Container ── */}
            <div
              className={cn(
                "flex w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
                currentStep === "save-dialog"
                  ? "animate-in fade-in zoom-in-95 min-h-[600px] max-w-5xl flex-row duration-300"
                  : "max-w-lg flex-col",
              )}
              style={currentStep !== "save-dialog" ? { maxHeight: "85vh" } : {}}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Left Side: Image Carousel (save-dialog only) ── */}

              {/* ── Right Side / Full content ── */}
              <div
                className={cn(
                  "flex flex-col",
                  currentStep === "save-dialog" ? "w-full md:w-1/2" : "w-full",
                )}
              >
                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-3">
                  <div>
                    {currentStep === "save-dialog" && (
                      <div className="mb-4">
                        <Image
                          src="/logos/logo-dark.png"
                          alt="Health Voice Logo"
                          width={150}
                          height={40}
                          className="h-auto max-h-[36px] w-auto"
                        />
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-gray-800">
                      {stepProgress.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {stepProgress.subtitle}
                    </p>
                  </div>
                  {stepProgress.canClose && (
                    <button
                      data-tracking-id="new-consultation-close-button"
                      onClick={() => resetFlow()}
                      className="self-start rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                    >
                      <X size={20} className="text-gray-400" />
                    </button>
                  )}
                </div>

                {/* ── Progress Bar ── */}
                <div className="flex gap-1.5 px-6 pt-3 pb-1">
                  {Array.from({ length: stepProgress.totalSteps }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-500",
                          i <= stepProgress.index
                            ? "bg-blue-600"
                            : "bg-gray-200",
                        )}
                      />
                    ),
                  )}
                </div>

                {/* ── Scrollable Content ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {/* ═══ SAVE DIALOG ═══ */}
                  {currentStep === "save-dialog" && (
                    <>
                      {error && (
                        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                          <AlertCircle
                            className="mt-0.5 flex-shrink-0 text-red-500"
                            size={18}
                          />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}

                      {/* Conteúdo simplificado: Gravar Lembrete */}
                      {simplifiedDialogMode === "lembrete" && (
                        <div className="space-y-5">
                          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                            <p className="text-sm text-gray-700">
                              Grave um áudio para seu lembrete. O tipo já está
                              definido como <strong>Lembrete</strong>; ao clicar
                              em iniciar você irá direto para a gravação.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              data-tracking-id="new-reminder-start-recording-button"
                              onClick={handleStartRecording}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]"
                            >
                              <Mic size={20} />
                              Iniciar Gravação
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Conteúdo simplificado: Gravação Pessoal (Estudos / Outros) */}
                      {simplifiedDialogMode === "personal" && (
                        <div className="space-y-5">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600">
                              Tipo de gravação
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  updateMetadata({
                                    personalRecordingType: "STUDY",
                                  })
                                }
                                className={cn(
                                  "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all",
                                  metadata.personalRecordingType === "STUDY"
                                    ? "border-blue-600 bg-blue-50 shadow-sm"
                                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50",
                                )}
                              >
                                <Pen
                                  size={22}
                                  className={
                                    metadata.personalRecordingType === "STUDY"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }
                                />
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    metadata.personalRecordingType === "STUDY"
                                      ? "text-blue-600"
                                      : "text-gray-700",
                                  )}
                                >
                                  Estudos
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateMetadata({
                                    personalRecordingType: "OTHER",
                                  })
                                }
                                className={cn(
                                  "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all",
                                  metadata.personalRecordingType === "OTHER"
                                    ? "border-blue-600 bg-blue-50 shadow-sm"
                                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50",
                                )}
                              >
                                <TriangleAlert
                                  size={22}
                                  className={
                                    metadata.personalRecordingType === "OTHER"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }
                                />
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    metadata.personalRecordingType === "OTHER"
                                      ? "text-blue-600"
                                      : "text-gray-700",
                                  )}
                                >
                                  Outros
                                </span>
                              </button>
                            </div>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              data-tracking-id="new-personal-recording-start-recording-button"
                              onClick={handleStartRecording}
                              disabled={!metadata.personalRecordingType}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Mic size={20} />
                              Iniciar Gravação
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Formulário completo (consulta ou pessoal com todos os campos) */}
                      {!simplifiedDialogMode && (
                        <>
                          <div className="space-y-5">
                            {/* Recording Name (optional) — first to match tour order */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-600">
                                Nome da Gravação{" "}
                                <span className="font-normal text-gray-400">
                                  (opcional)
                                </span>
                              </label>
                              <input
                                data-tour="recording-name"
                                type="text"
                                value={metadata.name}
                                onChange={(e) =>
                                  updateMetadata({ name: e.target.value })
                                }
                                placeholder={
                                  metadata.recordingType === "CLIENT"
                                    ? "Ex: Consulta - João Silva"
                                    : metadata.personalRecordingType ===
                                        "REMINDER"
                                      ? "Ex: Lembrete - Assinar documento"
                                      : metadata.personalRecordingType ===
                                          "STUDY"
                                        ? "Ex: Estudo - Análise de dados"
                                        : "Ex: Gravação pessoal"
                                }
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Consultation Type (CLIENT) */}
                            {metadata.recordingType === "CLIENT" && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-600">
                                  Tipo de Consulta
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() =>
                                      updateMetadata({
                                        consultationType: "IN_PERSON",
                                      })
                                    }
                                    className={cn(
                                      "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all",
                                      metadata.consultationType === "IN_PERSON"
                                        ? "border-blue-600 bg-blue-50 shadow-sm"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50",
                                    )}
                                  >
                                    <Mic
                                      size={20}
                                      className={cn(
                                        metadata.consultationType ===
                                          "IN_PERSON"
                                          ? "text-blue-600"
                                          : "text-gray-400",
                                      )}
                                    />
                                    <div className="text-left">
                                      <p
                                        className={cn(
                                          "text-sm font-semibold",
                                          metadata.consultationType ===
                                            "IN_PERSON"
                                            ? "text-blue-600"
                                            : "text-gray-800",
                                        )}
                                      >
                                        Presencial
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Apenas áudio
                                      </p>
                                    </div>
                                  </button>

                                  <button
                                    data-tour="consultation-online"
                                    onClick={() =>
                                      updateMetadata({
                                        consultationType: "ONLINE",
                                      })
                                    }
                                    className={cn(
                                      "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all",
                                      metadata.consultationType === "ONLINE"
                                        ? "border-blue-600 bg-blue-50 shadow-sm"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50",
                                    )}
                                  >
                                    <Video
                                      size={20}
                                      className={cn(
                                        metadata.consultationType === "ONLINE"
                                          ? "text-blue-600"
                                          : "text-gray-400",
                                      )}
                                    />
                                    <div className="text-left">
                                      <p
                                        className={cn(
                                          "text-sm font-semibold",
                                          metadata.consultationType === "ONLINE"
                                            ? "text-blue-600"
                                            : "text-gray-800",
                                        )}
                                      >
                                        Online
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Vídeo + áudio
                                      </p>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Personal Recording Type */}
                            {metadata.recordingType === "PERSONAL" &&
                              !initialReminderId && (
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-gray-600">
                                    Tipo de Gravação
                                  </label>
                                  <div className="grid grid-cols-3 gap-2">
                                    <button
                                      onClick={() =>
                                        updateMetadata({
                                          personalRecordingType: "REMINDER",
                                        })
                                      }
                                      className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all",
                                        metadata.personalRecordingType ===
                                          "REMINDER"
                                          ? "border-blue-600 bg-blue-50 shadow-sm"
                                          : "border-gray-200 hover:border-blue-300",
                                      )}
                                    >
                                      <Lightbulb
                                        size={20}
                                        className={cn(
                                          metadata.personalRecordingType ===
                                            "REMINDER"
                                            ? "text-blue-600"
                                            : "text-gray-400",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "text-xs font-semibold",
                                          metadata.personalRecordingType ===
                                            "REMINDER"
                                            ? "text-blue-600"
                                            : "text-gray-700",
                                        )}
                                      >
                                        Lembrete
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateMetadata({
                                          personalRecordingType: "STUDY",
                                        })
                                      }
                                      className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all",
                                        metadata.personalRecordingType ===
                                          "STUDY"
                                          ? "border-blue-600 bg-blue-50 shadow-sm"
                                          : "border-gray-200 hover:border-green-300",
                                      )}
                                    >
                                      <Pen
                                        size={20}
                                        className={cn(
                                          metadata.personalRecordingType ===
                                            "STUDY"
                                            ? "text-blue-600"
                                            : "text-gray-400",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "text-xs font-semibold",
                                          metadata.personalRecordingType ===
                                            "STUDY"
                                            ? "text-blue-600"
                                            : "text-gray-700",
                                        )}
                                      >
                                        Estudos
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateMetadata({
                                          personalRecordingType: "OTHER",
                                        })
                                      }
                                      className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all",
                                        metadata.personalRecordingType ===
                                          "OTHER"
                                          ? "border-blue-600 bg-blue-50 shadow-sm"
                                          : "border-gray-200 hover:border-orange-300",
                                      )}
                                    >
                                      <TriangleAlert
                                        size={20}
                                        className={cn(
                                          metadata.personalRecordingType ===
                                            "OTHER"
                                            ? "text-blue-600"
                                            : "text-gray-400",
                                        )}
                                      />
                                      <span
                                        className={cn(
                                          "text-xs font-semibold",
                                          metadata.personalRecordingType ===
                                            "OTHER"
                                            ? "text-blue-600"
                                            : "text-gray-700",
                                        )}
                                      >
                                        Outro
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}

                            {/* ── Patient Selection (inline) ── */}
                            {metadata.recordingType === "CLIENT" && (
                              <div data-tour="patient-selector">
                                <div className="mb-2 flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-600">
                                    Paciente{" "}
                                    <span className="text-red-400">*</span>
                                  </label>
                                  {!isCreatingPatient && (
                                    <button
                                      data-tour="cadastrar-novo-paciente-btn"
                                      data-tracking-id="new-consultation-create-client-button"
                                      onClick={() => setIsCreatingPatient(true)}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                      <UserPlus size={14} />
                                      Cadastrar novo paciente
                                    </button>
                                  )}
                                </div>

                                {!isCreatingPatient ? (
                                  <div className="overflow-hidden rounded-xl border border-gray-200">
                                    {/* Search bar */}
                                    <div className="relative border-b border-gray-100 bg-gray-50/50">
                                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                      <input
                                        value={patientSearch}
                                        onChange={(e) =>
                                          setPatientSearch(e.target.value)
                                        }
                                        placeholder="Buscar paciente..."
                                        className="w-full bg-transparent py-2.5 pr-4 pl-10 text-sm outline-none placeholder:text-gray-400"
                                      />
                                    </div>

                                    {/* Patient list */}
                                    <div className="max-h-44 overflow-y-auto">
                                      <button
                                        style={{ display: "none" }}
                                        aria-hidden
                                      >
                                        placeholder
                                      </button>

                                      {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => (
                                          <button
                                            key={client.id}
                                            data-tracking-id="new-consultation-client-select"
                                            onClick={() => {
                                              updateMetadata({
                                                selectedClientId: client.id,
                                              });
                                              
                                              // Tracking: CLIENT_SELECTED
                                              const modalId = metadata.recordingType === "CLIENT" 
                                                ? "new-consultation-modal"
                                                : "new-personal-recording-modal";
                                              
                                              trackAction(
                                                {
                                                  actionType: UserActionType.CLIENT_SELECTED,
                                                  metadata: {
                                                    modalId,
                                                    clientId: client.id,
                                                    source: modalSourceRef.current || "unknown",
                                                  },
                                                },
                                                PostAPI,
                                              ).catch((error) => {
                                                console.warn("Erro ao registrar CLIENT_SELECTED:", error);
                                              });
                                            }}
                                            className={cn(
                                              "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors",
                                              metadata.selectedClientId ===
                                                client.id
                                                ? "bg-blue-50 font-medium text-blue-700"
                                                : "text-gray-700 hover:bg-gray-50",
                                            )}
                                          >
                                            <span>{client.name}</span>
                                            {metadata.selectedClientId ===
                                              client.id && (
                                              <CheckCircle2
                                                size={16}
                                                className="text-blue-600"
                                              />
                                            )}
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                                          {patientSearch
                                            ? "Nenhum paciente encontrado"
                                            : "Nenhum paciente cadastrado"}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  /* ── Inline Create Patient Form ── */
                                  <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-gray-700">
                                        Novo Paciente
                                      </span>
                                    <button
                                      data-tour="create-patient-back-btn"
                                      data-tracking-id="new-consultation-create-client-back-button"
                                      onClick={() =>
                                        setIsCreatingPatient(false)
                                      }
                                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      ← Voltar à lista
                                    </button>
                                    </div>

                                    <input
                                      data-tour="create-client-name"
                                      value={newPatientName}
                                      onChange={(e) =>
                                        setNewPatientName(e.target.value)
                                      }
                                      placeholder="Nome do paciente *"
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      autoFocus
                                    />

                                    <textarea
                                      value={newPatientDescription}
                                      onChange={(e) =>
                                        setNewPatientDescription(e.target.value)
                                      }
                                      placeholder="Descrição (opcional)"
                                      className="h-16 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />

                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-gray-500">
                                        Data de nascimento (opcional)
                                      </label>
                                      <input
                                        type="date"
                                        value={newPatientBirthDate}
                                        onChange={(e) =>
                                          setNewPatientBirthDate(e.target.value)
                                        }
                                        max={
                                          new Date().toISOString().split("T")[0]
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>

                                    <button
                                      data-tour="create-client-submit-btn"
                                      data-tracking-id="new-consultation-create-client-submit-button"
                                      onClick={handleInlineCreatePatient}
                                      disabled={
                                        isCreatingPatientLoading ||
                                        newPatientName.trim().length < 2
                                      }
                                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {isCreatingPatientLoading ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <>
                                          <UserPlus size={16} />
                                          Criar e Selecionar
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Start Recording Button */}
                          <div className="mt-6">
                            <button
                              data-tour="start-recording-btn"
                              data-tracking-id="new-consultation-start-recording-button"
                              onClick={handleStartRecording}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]"
                            >
                              {currentMediaType === "video" ? (
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
                        </>
                      )}
                    </>
                  )}

                  {/* ═══ INSTRUCTIONS ═══ */}
                  {currentStep === "instructions" && (
                    <>
                      <div className="space-y-4">
                        <div
                          data-tour="instructions-block"
                          className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                        >
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
                            <AlertCircle size={18} />
                            Instruções Importantes
                          </h3>
                          <ol className="space-y-2.5 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <span className="min-w-[20px] font-bold">1.</span>
                              <span>
                                Na próxima tela, selecione a{" "}
                                <strong>ABA do Google Meet</strong> (não a
                                janela inteira)
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="min-w-[20px] font-bold">2.</span>
                              <span>
                                Certifique-se de{" "}
                                <strong>
                                  marcar a opção &quot;Compartilhar áudio da
                                  aba&quot;
                                </strong>
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="min-w-[20px] font-bold">3.</span>
                              <span>
                                Clique em{" "}
                                <strong>&quot;Compartilhar&quot;</strong>
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="min-w-[20px] font-bold">4.</span>
                              <span>
                                A gravação iniciará automaticamente e capturará
                                vídeo + áudio da reunião
                              </span>
                            </li>
                          </ol>
                        </div>

                        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                          <div className="flex items-start gap-2 text-sm text-green-800">
                            <CheckCircle2
                              size={18}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <p>
                              <strong>Dica:</strong> O áudio do seu microfone
                              também será capturado automaticamente.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          data-tour="instructions-back-btn"
                          data-tracking-id="new-consultation-instructions-back-button"
                          onClick={() => setCurrentStep("save-dialog")}
                          className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          Voltar
                        </button>
                        <button
                          data-tour="start-video-recording-btn"
                          data-tracking-id="new-consultation-start-video-recording-button"
                          onClick={handleStartVideoRecording}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          <Video size={18} />
                          Iniciar Gravação
                        </button>
                      </div>
                    </>
                  )}

                  {/* ═══ RECORDING ═══ */}
                  {currentStep === "recording" && (
                    <>
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                          <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-blue-600">
                            {metadata.consultationType === "ONLINE" ? (
                              <Video size={40} className="text-white" />
                            ) : (
                              <Mic size={40} className="text-white" />
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 h-6 w-6 animate-ping rounded-full bg-blue-600" />
                        </div>

                        <p className="mt-6 text-3xl font-bold text-gray-800">
                          {formatDuration(recorder.duration)}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          {metadata.consultationType === "ONLINE"
                            ? "Gravando vídeo e áudio..."
                            : "Gravando áudio..."}
                        </p>
                      </div>

                      {metadata.consultationType === "ONLINE" && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                          <p className="text-center text-xs text-yellow-800">
                            Para parar, clique em &quot;Parar
                            compartilhamento&quot; na barra do navegador ou no
                            botão abaixo
                          </p>
                        </div>
                      )}

                      <div className="mt-6">
                        <button
                          data-tour="stop-recording-btn"
                          onClick={recorder.stopRecording}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          <Pause size={20} />
                          Parar Gravação
                        </button>
                      </div>
                    </>
                  )}

                  {/* ═══ PREVIEW ═══ */}
                  {currentStep === "preview" && (
                    <>
                      <div className="space-y-4">
                        {currentMediaType === "video" && (
                          <div className="overflow-hidden rounded-xl bg-black">
                            <video
                              ref={videoPreviewRef}
                              controls
                              className="w-full"
                              style={{ maxHeight: "300px" }}
                            >
                              Seu navegador não suporta o elemento de vídeo.
                            </video>
                          </div>
                        )}

                        {currentMediaType === "audio" && (
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
                        )}

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
                              {currentMediaType === "video"
                                ? "Vídeo + Áudio"
                                : "Áudio"}
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
                              Reproduza e verifique se a qualidade está boa
                              antes de enviar.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={handleRetryRecording}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <RefreshCw size={16} />
                          Regravar
                        </button>
                        <button
                          data-tour="confirm-send-btn"
                          onClick={handleConfirmRecording}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          <Send size={16} />
                          Confirmar e Enviar
                        </button>
                      </div>
                    </>
                  )}

                  {/* ═══ PROCESSING ═══ */}
                  {currentStep === "processing" && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                      <p className="mt-5 text-base font-semibold text-gray-800">
                        Processando gravação...
                      </p>
                      <p className="mt-1.5 text-center text-sm text-gray-500">
                        Aguarde enquanto preparamos sua gravação
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* end right side */}
              {currentStep === "save-dialog" && (
                <div className="relative hidden w-1/2 overflow-hidden bg-blue-900 md:block">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent" />

                  <div className="absolute top-10 left-10 z-20">
                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                      <span className="text-xs font-semibold tracking-wide text-white">
                        Plataforma Segura
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-10 left-10 z-20 max-w-md pr-8 text-white">
                    <h3 className="text-3xl leading-tight font-bold tracking-tight">
                      A revolução do <br /> atendimento médico.
                    </h3>
                    <p className="mt-4 text-base leading-relaxed font-light text-blue-100 opacity-90">
                      Registre sua consulta com inteligência artificial e
                      transforme seu atendimento.
                    </p>
                  </div>

                  {carouselImages.map((img, index) => (
                    <div
                      key={img}
                      className={cn(
                        "absolute inset-0 h-full w-full transform bg-cover bg-center transition-all duration-1000 ease-in-out",
                        index === currentImageIndex
                          ? "scale-105 opacity-100"
                          : "scale-100 opacity-0",
                      )}
                      style={{ backgroundImage: `url(${img})` }}
                    />
                  ))}

                  <div className="absolute right-10 bottom-10 z-20 flex gap-2">
                    {carouselImages.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 rounded-full transition-all duration-300",
                          i === currentImageIndex
                            ? "w-8 bg-blue-400"
                            : "w-2 bg-white/30",
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
