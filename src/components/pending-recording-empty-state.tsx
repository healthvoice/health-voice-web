"use client";

import { RequestTranscription } from "@/components/ui/request-transcription";
import { useGeneralContext } from "@/context/GeneralContext";
import { FileText, ScrollText, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

type Variant = "resumo" | "transcricao" | "insights";

const config: Record<
  Variant,
  {
    icon: typeof FileText;
    title: string;
    description: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  resumo: {
    icon: FileText,
    title: "Resumo indisponível",
    description:
      "O resumo desta gravação ainda não foi gerado. Solicite a transcrição para que a IA possa processar o áudio e exibir o resumo aqui.",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  transcricao: {
    icon: ScrollText,
    title: "Transcrição não disponível",
    description:
      "Esta gravação ainda não foi transcrita. Clique no botão abaixo para solicitar a transcrição. O processamento pode levar alguns minutos.",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  insights: {
    icon: Sparkles,
    title: "Insights não disponíveis",
    description:
      "O resumo estruturado e os insights desta gravação serão gerados após a transcrição. Solicite a transcrição para desbloquear esta seção.",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
};

interface PendingRecordingEmptyStateProps {
  variant: Variant;
  className?: string;
  /** Se true, mostra o botão de solicitar transcrição (padrão: true quando não DONE) */
  showRequestCta?: boolean;
  isPrincipal?: boolean;
}

export function PendingRecordingEmptyState({
  variant,
  className,
  showRequestCta = true,
  isPrincipal = false,
}: PendingRecordingEmptyStateProps) {
  const { selectedRecording } = useGeneralContext();
  const { icon: Icon, title, description, iconBg, iconColor } = config[variant];

  const isPending = selectedRecording?.transcriptionStatus === "PENDING";
  const isDone = selectedRecording?.transcriptionStatus === "DONE";
  const showCta = showRequestCta && !isDone;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white p-8 text-center shadow-sm sm:p-12",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
          iconBg,
          iconColor,
        )}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-gray-900 sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
        {description}
      </p>
      {showCta && (
        <div className="mt-8 flex justify-center">
          <RequestTranscription inline isPrincipal={isPrincipal} />
        </div>
      )}
      {isPending && (
        <p className="mt-4 text-xs font-medium text-amber-600">
          Transcrição em processamento. Atualize a página em alguns minutos.
        </p>
      )}
    </div>
  );
}
