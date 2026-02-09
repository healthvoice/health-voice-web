"use client";

import { useSession } from "@/context/auth";
import { cn } from "@/utils/cn";
import { X, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

// Placeholder para imagens dos passos - você precisará adicionar as imagens reais
const STEP_IMAGES = [
  "/images/trial-step-1.png",
  "/images/trial-step-2.png",
  "/images/trial-step-3.png",
];

interface StepContent {
  image: string;
  title: string;
  text: string;
}

const steps: StepContent[] = [
  {
    image: STEP_IMAGES[0],
    title: "Bem-vindo ao Health Voice!",
    text: "Descubra como nosso aplicativo pode transformar sua rotina médica. Grave consultas, gerencie prontuários e acesse a inteligência do Health Voice de onde estiver.",
  },
  {
    image: STEP_IMAGES[1],
    title: "Funcionalidades Incríveis",
    text: "Grave consultas com apenas um toque, mesmo sem internet. A IA cuida de toda a documentação automaticamente, economizando seu tempo precioso.",
  },
  {
    image: STEP_IMAGES[2],
    title: "Baixe o App Agora",
    text: "Transforme seu celular na ferramenta mais poderosa do seu consultório. Baixe agora e comece a usar todas as funcionalidades do Health Voice.",
  },
];

const STORAGE_KEY = "trialAppModalClosedAt";
const COOLDOWN_MINUTES = 30;

export function TrialAppModal() {
  const { isTrial, profile } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [canClose, setCanClose] = useState(false);

  // Abrir modal quando o usuário for trial e tiver passado o cooldown
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (!profile || !isTrial) {
      setIsOpen(false);
      return;
    }

    // Verificar se pode abrir a modal (30 minutos após fechar)
    const closedAt = localStorage.getItem(STORAGE_KEY);
    if (!closedAt) {
      // Nunca foi fechada, pode abrir
      setIsOpen(true);
      return;
    }

    const closedTimestamp = parseInt(closedAt, 10);
    const now = Date.now();
    const minutesSinceClosed = (now - closedTimestamp) / (1000 * 60);

    // Só abre se passaram 30 minutos
    if (minutesSinceClosed >= COOLDOWN_MINUTES) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [profile, isTrial]);

  // Timer decrescente de 5 segundos na última etapa
  useEffect(() => {
    if (currentStep === 2 && isOpen) {
      setCanClose(false);
      setTimeRemaining(5);
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanClose(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCanClose(true);
      setTimeRemaining(0);
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    // Salvar timestamp no localStorage quando fechar
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
    
    setIsOpen(false);
    setCurrentStep(0);
    setTimeRemaining(5);
    setCanClose(false);
  };

  // Links dos apps
  const appleStoreLink = "https://apps.apple.com/br/app/executivos-voice/id6754694679";
  const googlePlayLink = "https://play.google.com/store/apps/details?id=com.executivos.healthvoice";

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-[6px] p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Health Voice</span>
          </div>
        </div>

        {/* Conteúdo da modal */}
        <div className="flex flex-col items-center px-8 py-8">
          {/* Imagem com proporção 3:4 */}
          <div className="relative mb-6 w-full max-w-[240px] aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100">
            {currentStepData.image ? (
              <Image
                src={currentStepData.image}
                alt={currentStepData.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-4xl">📱</span>
              </div>
            )}
          </div>

          {/* Título */}
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
            {currentStepData.title}
          </h2>

          {/* Texto */}
          <p className="mb-8 text-center text-base leading-relaxed text-gray-600">
            {currentStepData.text}
          </p>

          {/* Indicador de passos */}
          <div className="mb-8 flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-blue-500"
                    : index < currentStep
                      ? "w-2 bg-blue-300"
                      : "w-2 bg-gray-300"
                )}
              />
            ))}
          </div>

          {/* Botões */}
          {isLastStep ? (
            <div className="w-full space-y-4">
              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <a
                  href={appleStoreLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-6 py-4 font-bold text-gray-900 transition-all hover:bg-gray-50 hover:scale-105 active:scale-95"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-gray-900"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span>Baixar na App Store</span>
                </a>
                <a
                  href={googlePlayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 items-center justify-center gap-3 rounded-xl bg-gray-900 px-6 py-4 font-bold text-white transition-all hover:bg-gray-800 hover:scale-105 active:scale-95"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-white"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span>Google Play</span>
                </a>
              </div>

              {/* Timer e botão "Começar a utilizar" */}
              {!canClose ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    Aguarde <span className="font-bold text-blue-600">{timeRemaining}s</span> para continuar
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleClose}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                >
                  <span>Começar a utilizar</span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
            >
              <span>Próximo</span>
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
