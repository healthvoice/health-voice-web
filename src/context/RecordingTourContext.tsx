"use client";

import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

/** Desative como false para desligar o tour; mude para true para reativar. */
export const TOUR_ENABLED = true;

const TOUR_COMPLETED_KEY = "health-voice-recording-tour-completed";
const TOUR_FINAL_STEP_KEY = "health-voice-recording-tour-final-step";

export function getTourCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
}

export function setTourCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_COMPLETED_KEY, "true");
}

export function setTourFinalStepPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOUR_FINAL_STEP_KEY, "1");
}

export function consumeTourFinalStepPending(): boolean {
  if (typeof window === "undefined") return false;
  const v = sessionStorage.getItem(TOUR_FINAL_STEP_KEY);
  sessionStorage.removeItem(TOUR_FINAL_STEP_KEY);
  return v === "1";
}

/** Validação de paciente: exigir paciente selecionado ao avançar do passo "Continuar" (6). */
const PATIENT_STEP_INDEX = 6;

interface RecordingTourContextValue {
  isTourActive: boolean;
  driverRef: React.MutableRefObject<Driver | null>;
  startTour: (initialStep?: number) => void;
  advanceToNextStep: () => void;
  getActiveIndex: () => number;
  destroyTour: () => void;
  shouldRunTour: () => boolean;
  /** Registra função que valida se pode avançar do passo Paciente (só avança se tiver paciente selecionado). */
  registerValidateAdvanceFromPatientStep: (fn: () => boolean) => void;
}

const RecordingTourContext = createContext<
  RecordingTourContextValue | undefined
>(undefined);

export function useRecordingTour() {
  const ctx = useContext(RecordingTourContext);
  if (!ctx) {
    throw new Error(
      "useRecordingTour deve ser usado dentro de RecordingTourProvider",
    );
  }
  return ctx;
}

// Steps where clicking Next should programmatically click the highlighted element
const ACTION_STEP_SELECTORS: Record<number, string> = {
  3: "[data-tour='cadastrar-novo-paciente-btn']",
  5: "[data-tour='create-client-submit-btn']",
  6: "[data-tour='start-recording-btn']",
  8: "[data-tour='start-video-recording-btn']",
  9: "[data-tour='stop-recording-btn']",
  10: "[data-tour='confirm-send-btn']",
};

// Steps where the app auto-advances the tour (don't call moveNext manually)
const AUTO_ADVANCE_STEPS = new Set([3, 5, 6, 8, 9, 10]);

const recordingTourSteps: DriveStep[] = [
  {
    element: "[data-tour='nova-gravacao-trigger']",
    popover: {
      title: "Nova Gravação",
      description:
        "Clique em <strong>Nova Gravação</strong> para abrir o menu.",
      side: "bottom",
      align: "center",
      showButtons: [],
    },
  },
  {
    element: "[data-tour='recording-name']",
    popover: {
      title: "Nome da gravação",
      description:
        "Digite um <strong>nome</strong> (opcional — será gerado automaticamente).",
      side: "bottom",
      align: "start",
      showButtons: ["next"],
    },
  },
  {
    element: "[data-tour='consultation-online']",
    popover: {
      title: "Tipo de consulta",
      description:
        "Selecione <strong>Online</strong> para gravar vídeo + áudio.",
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous"],
    },
  },

  {
    element: "[data-tour='cadastrar-novo-paciente-btn']",
    popover: {
      title: "Cadastrar Paciente",
      description: "Clique para cadastrar um <strong>novo paciente</strong>.",
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous"],
    },
  },
  {
    element: "[data-tour='create-client-name']",
    popover: {
      title: "Nome do paciente",
      description: "Digite o <strong>nome do paciente</strong>.",
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous"],
    },
  },
  {
    element: "[data-tour='create-client-submit-btn']",
    popover: {
      title: "Criar e Selecionar",
      description: "Clique em <strong>Criar e Selecionar</strong> para salvar.",
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous"],
    },
  },
  {
    element: "[data-tour='start-recording-btn']",
    popover: {
      title: "Iniciar",
      description: "Clique em <strong>Continuar</strong> para avançar.",
      side: "bottom",
      align: "start",
      showButtons: ["next"],
    },
  },
  {
    element: "[data-tour='instructions-block']",
    popover: {
      title: "Instruções",
      description:
        'Selecione a <strong>aba da reunião</strong>, marque "Compartilhar áudio da aba" e clique em Compartilhar.',
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous"],
    },
  },
  {
    element: "[data-tour='start-video-recording-btn']",
    popover: {
      title: "Iniciar gravação",
      description:
        "Clique em <strong>Iniciar Gravação</strong>. Após ~10s, pare.",
      side: "bottom",
      align: "start",
      showButtons: ["next"],
    },
  },
  {
    element: "[data-tour='stop-recording-btn']",
    popover: {
      title: "Parar gravação",
      description: "Clique em <strong>Parar Gravação</strong>.",
      side: "bottom",
      align: "start",
      showButtons: ["next"],
    },
  },
  {
    element: "[data-tour='confirm-send-btn']",
    popover: {
      title: "Confirmar e enviar",
      description: "Clique em <strong>Confirmar e Enviar</strong> para salvar.",
      side: "bottom",
      align: "start",
      showButtons: ["next"],
    },
  },
  {
    element: "[data-tour='recordings-page']",
    popover: {
      title: "Tour concluído!",
      description: "Aqui ficam todas as suas <strong>gravações</strong>.",
      side: "bottom",
      align: "start",
      showButtons: ["close"],
      doneBtnText: "Concluir",
    },
  },
];

/** Mostra apenas o passo final do tour na página de gravações (permite fechar). */
export function showRecordingTourFinalStep(): void {
  if (!TOUR_ENABLED || typeof window === "undefined") return;
  const lastStep = recordingTourSteps[recordingTourSteps.length - 1];
  const driverObj = driver({
    showProgress: false,
    allowClose: true,
    overlayOpacity: 0.5,
    steps: [lastStep],
    onDestroyed: () => setTourCompleted(),
  });
  driverObj.drive(0);
}

export function RecordingTourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const driverRef = useRef<Driver | null>(null);
  const validateAdvanceFromPatientStepRef = useRef<() => boolean>(() => true);
  const [isTourActive, setIsTourActive] = useState(false);

  const registerValidateAdvanceFromPatientStep = useCallback(
    (fn: () => boolean) => {
      validateAdvanceFromPatientStepRef.current = fn;
    },
    [],
  );

  const destroyTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsTourActive(false);
  }, []);

  const advanceToNextStep = useCallback(() => {
    if (driverRef.current?.hasNextStep()) {
      driverRef.current.moveNext();
    } else {
      destroyTour();
    }
  }, [destroyTour]);

  const getActiveIndex = useCallback(() => {
    return driverRef.current?.getActiveIndex() ?? -1;
  }, []);

  const shouldRunTour = useCallback(() => {
    return TOUR_ENABLED && !getTourCompleted();
  }, []);

  const startTour = useCallback((initialStep: number = 0) => {
    if (!TOUR_ENABLED) return;
    if (initialStep !== 0 && getTourCompleted()) return;
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    const clickTourElement = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) el.click();
    };

    const driverObj = driver({
      showProgress: true,
      allowClose: false,
      overlayOpacity: 0.75,
      overlayClickBehavior: () => {},
      steps: recordingTourSteps,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      onHighlightStarted: (_element, step) => {
        const idx = recordingTourSteps.indexOf(step);
        if (idx >= 0)
          (window as unknown as { __tourStep?: number }).__tourStep = idx;
        // Passos com UI dinâmica/modal: refresh com delay para o popover não ir pro canto
        if ([1, 4, 7, 9].includes(idx)) {
          setTimeout(() => driverRef.current?.refresh(), 100);
          setTimeout(() => driverRef.current?.refresh(), 500);
        }
      },
      onNextClick: (_element, _step, options) => {
        const idx = options.state.activeIndex ?? 0;

        // Exigir paciente selecionado ao clicar em "Continuar" (step 6)
        if (
          idx === PATIENT_STEP_INDEX &&
          validateAdvanceFromPatientStepRef.current
        ) {
          if (!validateAdvanceFromPatientStepRef.current()) {
            toast.error(
              "Selecione um paciente ou cadastre um novo para continuar.",
            );
            return;
          }
        }

        // Action steps: click the actual element instead of just moving the highlight
        const selector = ACTION_STEP_SELECTORS[idx];
        if (selector) {
          clickTourElement(selector);
          // Step 8 (Iniciar gravação): a UI muda e o botão some — avançar para o passo "Parar gravação" e refresh
          if (idx === 8) {
            setTimeout(() => {
              options.driver.moveNext();
              setTimeout(() => options.driver.refresh(), 200);
              setTimeout(() => options.driver.refresh(), 700);
            }, 200);
            return;
          }
          // For auto-advance steps, the AudioRecorder's useEffect will advance the tour
          if (AUTO_ADVANCE_STEPS.has(idx)) return;
          // Steps 3 (abrir form) e 5 (submit): o audio-recorder avança o tour
          return;
        }

        options.driver.moveNext();
      },
      onPrevClick: (_element, _step, options) => {
        const idx = options.state.activeIndex ?? 0;

        // Do formulário inline (nome ou submit) voltar: fechar o form ao sair do passo 4
        if (idx === 4) {
          clickTourElement("[data-tour='create-patient-back-btn']");
          setTimeout(() => options.driver.movePrevious(), 350);
          return;
        }

        // From instructions (step 8) back to save-dialog
        if (idx === 8) {
          clickTourElement("[data-tour='instructions-back-btn']");
          setTimeout(() => options.driver.movePrevious(), 350);
          return;
        }

        options.driver.movePrevious();
      },
      onDestroyed: () => {
        setTourCompleted();
        setIsTourActive(false);
      },
    });

    driverRef.current = driverObj;
    setIsTourActive(true);
    driverObj.drive(Math.min(initialStep, recordingTourSteps.length - 1));
  }, []);

  const value: RecordingTourContextValue = {
    isTourActive,
    driverRef,
    startTour,
    advanceToNextStep,
    getActiveIndex,
    destroyTour,
    shouldRunTour,
    registerValidateAdvanceFromPatientStep,
  };

  return (
    <RecordingTourContext.Provider value={value}>
      {children}
    </RecordingTourContext.Provider>
  );
}
