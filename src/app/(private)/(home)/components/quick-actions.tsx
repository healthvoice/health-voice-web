"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  Bell,
  BookOpen,
  CircleDashed,
  Mic,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent } from "react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface QuickActionsProps {
  className?: string;
  onNewPatientClick?: () => void;
  onNewReminderClick?: () => void;
  onNewPersonalClick?: () => void;
}

function ActionCard({ action, index }: { action: QuickAction; index: number }) {
  const Icon = action.icon;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="group flex cursor-pointer flex-col items-center"
      onClick={action.onClick}
      data-tracking-id={`home-quick-actions-${action.id}`}
    >
      {/* O Quadrado Principal com ícone e textos dentro */}
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onMouseMove={handleMouseMove}
        className="relative flex w-full max-w-[250px] flex-col overflow-hidden rounded-[1.5rem] border border-blue-400/30 bg-gradient-to-br from-sky-500 to-blue-600 shadow-xl shadow-blue-900/20 transition-all duration-500 group-hover:border-blue-300/50 group-hover:from-sky-400 group-hover:to-blue-500 group-hover:shadow-blue-500/40"
      >
        {/* Área do ícone (parte superior - quadrado) */}
        <div className="relative flex aspect-square w-full flex-col items-center justify-center">
          {/* Efeito Spotlight dinâmico no hover (Ajustado para branco translúcido) */}
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  200px circle at ${mouseX}px ${mouseY}px,
                  rgba(255, 255, 255, 0.25),
                  transparent 80%
                )
              `,
            }}
          />

          {/* FORMAS FLUTUANTES NO FUNDO (Agora brancas/translúcidas para contrastar com o azul) */}

          {/* Forma 1: Orb Superior Direito (Lento) */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-4 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20"
          />

          {/* Forma 2: Orb Inferior Esquerdo (Médio) */}
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/20"
          />

          {/* Forma 3: Pequeno detalhe geométrico flutuante (Rápido) */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 45, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-6 left-6 text-white/40 transition-colors duration-300 group-hover:text-white/70"
          >
            <Sparkles size={16} />
          </motion.div>

          {/* Forma 4: Círculo tracejado no fundo rodando */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute right-6 bottom-6 text-white/30 transition-colors duration-300 group-hover:text-white/60"
          >
            <CircleDashed size={24} />
          </motion.div>

          {/* ÍCONE PRINCIPAL (Centro - Agora Branco) */}
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]">
            <Icon
              className="h-8 w-8 text-blue-600 drop-shadow-sm transition-colors duration-300 group-hover:text-blue-500"
              strokeWidth={2}
            />
          </div>
          <div className="relative flex flex-col items-center gap-1 px-4 pt-2 pb-4 text-center">
            <h3 className="text-sm font-bold text-white transition-colors duration-300 group-hover:text-white/95">
              {action.label}
            </h3>
            {action.description === "Estudos ou anotações rápidas" && (
              <p className="absolute -bottom-6 line-clamp-2 text-xs text-white/80 transition-colors duration-300 group-hover:text-white/90">
                {action.description}
              </p>
            )}
          </div>
        </div>

        {/* TEXTOS (Dentro do quadrado, abaixo da área do ícone) */}
      </motion.div>
    </motion.div>
  );
}

export function QuickActions({
  className,
  onNewPatientClick,
  onNewReminderClick,
  onNewPersonalClick,
}: QuickActionsProps) {
  const { openNewRecording } = useGeneralContext();
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: "record-client",
      label: "Gravar consulta",
      description: "Inicie uma consulta no prontuário",
      icon: Mic,
      onClick: () => openNewRecording("CLIENT"),
    },
    {
      id: "new-reminder",
      label: "Criar Lembrete",
      description: "Programe para o dia de hoje",
      icon: Bell,
      onClick: () =>
        onNewReminderClick
          ? onNewReminderClick()
          : openNewRecording("PERSONAL", "REMINDER", {
              simplifiedLembrete: true,
            }),
    },
    {
      id: "record-personal",
      label: "Gravação Pessoal",
      description: "Estudos ou anotações rápidas",
      icon: BookOpen,
      onClick: () =>
        onNewPersonalClick
          ? onNewPersonalClick()
          : openNewRecording("PERSONAL", undefined, {
              simplifiedPersonal: true,
            }),
    },
    {
      id: "new-client",
      label: "Cadastrar Paciente",
      description: "Cadastre na plataforma",
      icon: UserPlus,
      onClick: () =>
        onNewPatientClick
          ? onNewPatientClick()
          : router.push("/clients?action=new"),
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:gap-x-4",
        className,
      )}
    >
      {actions.map((action, i) => (
        <ActionCard key={action.id} action={action} index={i} />
      ))}
    </div>
  );
}
