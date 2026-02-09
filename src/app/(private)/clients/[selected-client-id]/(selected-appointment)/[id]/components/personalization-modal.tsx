"use client";

import { cn } from "@/utils/cn";
import { ChevronRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

// Placeholder para imagens dos passos - você precisará adicionar as imagens reais
const STEP_IMAGES = [
  "/images/personalization-step-1.png",
  "/images/personalization-step-2.png",
  "/images/personalization-step-3.png",
  "/images/personalization-step-4.png",
  "/images/personalization-step-5.png",
];

interface StepContent {
  image: string;
  title: string;
  text: string;
}

const steps: StepContent[] = [
  {
    image: STEP_IMAGES[0],
    title: "Personalize seus Prontuários",
    text: "Crie prompts personalizados que se adaptem perfeitamente ao seu estilo de trabalho e às necessidades da sua especialidade médica.",
  },
  {
    image: STEP_IMAGES[1],
    title: "Economize Tempo",
    text: "Com prompts personalizados, a IA gera prontuários e resumos exatamente como você precisa, reduzindo o tempo de edição e revisão.",
  },
  {
    image: STEP_IMAGES[2],
    title: "Padronize seu Trabalho",
    text: "Mantenha consistência em todos os seus prontuários com templates personalizados que refletem suas preferências e protocolos.",
  },
  {
    image: STEP_IMAGES[3],
    title: "Aumente a Qualidade",
    text: "Prontuários mais precisos e completos, gerados com base nas suas especificações e melhores práticas da sua área.",
  },
  {
    image: STEP_IMAGES[4],
    title: "Fale com Nossa Equipe",
    text: "Nossos especialistas estão prontos para criar prompts personalizados exclusivos para você. Entre em contato via WhatsApp!",
  },
];

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "resumo" | "prontuario";
}

const WHATSAPP_LINK = "https://api.whatsapp.com/send/?phone=5541997819114&text&type=phone_number&app_absent=0";

export function PersonalizationModal({ isOpen, onClose, type }: PersonalizationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenModal, setHasSeenModal] = useState(false);

  // Resetar para o primeiro passo quando abrir
  useEffect(() => {
    if (isOpen && !hasSeenModal) {
      setCurrentStep(0);
      setHasSeenModal(true);
    }
  }, [isOpen, hasSeenModal]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // No último passo, pode fechar
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    // Resetar para o primeiro passo quando fechar
    setCurrentStep(0);
  };

  const handleWhatsAppClick = () => {
    const message = type === "resumo" 
      ? "Olá! Gostaria de personalizar meus resumos gerais no Health Voice."
      : "Olá! Gostaria de personalizar meus prontuários médicos no Health Voice.";
    
    const whatsappUrl = `${WHATSAPP_LINK}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    handleClose();
  };

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
                <span className="text-4xl">📋</span>
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
            <div className="flex w-full flex-col gap-4">
              <button
                onClick={handleWhatsAppClick}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-4 font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40 hover:scale-105 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Falar com Especialista no WhatsApp</span>
              </button>
              <button
                onClick={handleClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                <span>Fechar</span>
              </button>
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
