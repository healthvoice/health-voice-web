"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { useButtonTracking } from "@/hooks/useButtonTracking";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Bell,
    BookOpen,
    Calendar,
    Clock,
    FileText,
    Mic,
    User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const TYPE_CONFIG = {
  CLIENT: {
    label: "Consulta",
    icon: Mic,
    color: "text-sky-600 bg-sky-100/50",
    dot: "bg-sky-500",
  },
  REMINDER: {
    label: "Lembrete",
    icon: Bell,
    color: "text-blue-600 bg-blue-100/50",
    dot: "bg-blue-500",
  },
  STUDY: {
    label: "Estudo",
    icon: BookOpen,
    color: "text-sky-700 bg-sky-200/50",
    dot: "bg-sky-700",
  },
  OTHER: {
    label: "Outro",
    icon: FileText,
    color: "text-slate-500 bg-slate-100/50",
    dot: "bg-slate-400",
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
  
  // Tracking de botões
  useButtonTracking();

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
        if (rec.clientId) router.push(`/clients/${rec.clientId}/${rec.id}`);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[2rem] border border-sky-100 bg-white/60 shadow-xl shadow-sky-900/5 backdrop-blur-xl",
        className,
      )}
    >
      {/* Brilho de fundo sutil */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-sky-100/50 bg-white/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800">
              Últimas Consultas
            </h3>
            <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              Consultas recentes
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/recordings")}
          data-tracking-id="home-recordings-see-all"
          data-tracking-destination="/recordings"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-white/80 hover:shadow-sm active:scale-95"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="relative z-10 flex flex-col px-3 py-3">
        <AnimatePresence mode="popLayout">
          {isGettingRecordings ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-0"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3"
                >
                  <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div
                      className="h-4 animate-pulse rounded-lg bg-slate-100"
                      style={{ width: `${60 + (i % 3) * 15}%` }}
                    />
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-6 w-14 shrink-0 animate-pulse rounded-lg bg-sky-100" />
                </div>
              ))}
            </motion.div>
          ) : recordings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-8"
            >
              <div className="rounded-2xl border border-sky-50 bg-white/50 p-4 shadow-sm">
                <Mic className="h-8 w-8 text-sky-200" />
              </div>
              <p className="text-sm font-medium text-slate-400">
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
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  onClick={() => handleClick(rec)}
                  data-tracking-id={`home-recordings-item-${rec.id}`}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all hover:bg-white/80 hover:shadow-md hover:shadow-sky-500/5 active:scale-[0.99]"
                >
                  {/* Type dot */}
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full shadow-sm",
                      cfg.dot,
                    )}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                      {rec.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                      {rec.client && (
                        <>
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="max-w-[100px] truncate">
                              {rec.client}
                            </span>
                          </span>
                          <span className="text-slate-300">•</span>
                        </>
                      )}
                      <span className="flex shrink-0 items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {rec.date}
                      </span>
                      {rec.duration && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex shrink-0 items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rec.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm",
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
