"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Mic,
  User,
} from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

const TYPE_CONFIG = {
  CLIENT: {
    label: "Consulta",
    icon: Mic,
    color: "text-sky-600 bg-sky-50",
    dot: "bg-sky-500",
  },
  REMINDER: {
    label: "Lembrete",
    icon: Bell,
    color: "text-blue-600 bg-blue-50",
    dot: "bg-blue-500",
  },
  STUDY: {
    label: "Estudo",
    icon: BookOpen,
    color: "text-sky-700 bg-sky-100",
    dot: "bg-sky-700",
  },
  OTHER: {
    label: "Outro",
    icon: FileText,
    color: "text-gray-500 bg-gray-100",
    dot: "bg-gray-400",
  },
};

const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const recDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (recDay.getTime() === today.getTime()) return "Hoje";
  if (recDay.getTime() === yesterday.getTime()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

interface RecentRecordingsListProps {
  className?: string;
}

export function RecentRecordingsList({ className }: RecentRecordingsListProps) {
  const router = useRouter();
  const { recordings: apiRecordings, isGettingRecordings } =
    useGeneralContext();

  const recordings = useMemo(() => {
    return apiRecordings
      .filter((rec: RecordingDetailsProps) => rec.type === "CLIENT")
      .slice(0, 6)
      .map((rec: RecordingDetailsProps) => {
      const createdAt = new Date(rec.createdAt);
      return {
        id: rec.id,
        name: rec.name,
        client: rec.client?.name || null,
        clientId: rec.client?.id || null,
        date: formatRelativeDate(createdAt),
        duration: rec.duration,
        type: rec.type as keyof typeof TYPE_CONFIG,
        reminderId: rec.reminderId,
      };
    });
  }, [apiRecordings]);

  const handleClick = (rec: (typeof recordings)[0]) => {
    switch (rec.type) {
      case "CLIENT":
        if (rec.clientId)
          router.push(`/clients/${rec.clientId}/appointment/${rec.id}`);
        break;
      case "REMINDER":
        if (rec.reminderId) router.push(`/reminders/${rec.reminderId}`);
        break;
      case "STUDY":
        router.push(`/studies/${rec.id}`);
        break;
      default:
        router.push(`/others/${rec.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className={cn(
        "flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm shadow-blue-500/20">
            <Mic className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-800">
              Últimas Consultas
            </h3>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Consultas recentes
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/recordings")}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-sky-50 active:scale-95"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col px-3 py-2">
        <AnimatePresence mode="popLayout">
          {isGettingRecordings ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-8"
            >
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              <p className="text-sm text-gray-400">Carregando consultas...</p>
            </motion.div>
          ) : recordings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2.5 py-8"
            >
              <div className="rounded-full bg-gray-50 p-3">
                <Mic className="h-6 w-6 text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                Nenhuma consulta ainda
              </p>
            </motion.div>
          ) : (
            recordings.map((rec, idx) => {
              const cfg = TYPE_CONFIG[rec.type] || TYPE_CONFIG.OTHER;
              return (
                <motion.button
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.03 }}
                  onClick={() => handleClick(rec)}
                  className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-all hover:bg-sky-50/80 hover:shadow-sm active:scale-[0.99]"
                >
                  {/* Type dot */}
                  <div
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-sky-700">
                      {rec.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      {rec.client && (
                        <>
                          <span className="flex items-center gap-0.5 truncate">
                            <User className="h-2.5 w-2.5 shrink-0" />
                            <span className="max-w-[80px] truncate">
                              {rec.client}
                            </span>
                          </span>
                          <span className="text-gray-200">·</span>
                        </>
                      )}
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Calendar className="h-2.5 w-2.5" />
                        {rec.date}
                      </span>
                      {rec.duration && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {rec.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      cfg.color,
                    )}
                  >
                    {cfg.label}
                  </span>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
