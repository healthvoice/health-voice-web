"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Bell, BookOpen, Mic, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  onClick: () => void;
}

interface QuickActionsProps {
  className?: string;
  /** Se informado, o botão "Novo Paciente" abre esta ação em vez de ir para /clients */
  onNewPatientClick?: () => void;
  /** Se informado, o botão "Novo Lembrete" abre a modal de novo lembrete em vez do gravador */
  onNewReminderClick?: () => void;
  /** Se informado, o botão "Gravação Pessoal" abre a modal (escolha Estudo/Outros + gravar) */
  onNewPersonalClick?: () => void;
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
      label: "Gravar com Paciente",
      description: "Inicie uma consulta vinculada ao prontuário",
      icon: Mic,
      iconBg: "bg-gradient-to-br from-sky-500 to-blue-600",
      onClick: () => openNewRecording("CLIENT"),
    },
    {
      id: "new-reminder",
      label: "Novo Lembrete",
      description: "Programe um lembrete para hoje",
      icon: Bell,
      iconBg: "bg-gradient-to-br from-blue-400 to-sky-600",
      onClick: () =>
        onNewReminderClick
          ? onNewReminderClick()
          : openNewRecording("PERSONAL", "REMINDER", { simplifiedLembrete: true }),
    },
    {
      id: "record-personal",
      label: "Gravação Pessoal",
      description: "Estudos ou anotações rápidas",
      icon: BookOpen,
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-700",
      onClick: () =>
        onNewPersonalClick
          ? onNewPersonalClick()
          : openNewRecording("PERSONAL", undefined, { simplifiedPersonal: true }),
    },
    {
      id: "new-client",
      label: "Novo Paciente",
      description: "Cadastre um novo paciente na plataforma",
      icon: UserPlus,
      iconBg: "bg-gradient-to-br from-sky-600 to-blue-800",
      onClick: () =>
        onNewPatientClick
          ? onNewPatientClick()
          : router.push("/clients?action=new"),
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-sky-200 hover:shadow-md hover:shadow-sky-500/10 active:scale-[0.98]"
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105",
                action.iconBg,
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-sky-700">
                {action.label}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-gray-400">
                {action.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
