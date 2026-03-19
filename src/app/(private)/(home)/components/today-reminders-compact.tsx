"use client";

import { ReminderProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, Check, Plus, X } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface LocalStatus {
  [id: string]: "pending" | "completed" | "cancelled";
}

interface TodayRemindersCompactProps {
  className?: string;
  onNewReminderClick?: () => void;
}

export function TodayRemindersCompact({
  className,
  onNewReminderClick,
}: TodayRemindersCompactProps) {
  const { PutAPI } = useApiContext();
  const router = useRouter();
  const {
    reminders: apiReminders,
    isGettingReminders,
  } = useGeneralContext();

  const [localStatuses, setLocalStatuses] = useState<LocalStatus>({});

  const todayReminders = useMemo(() => {
    const todayLocal = moment().format("YYYY-MM-DD");
    return apiReminders
      .filter((r: ReminderProps) => {
        const day = moment.utc(r.date).format("YYYY-MM-DD");
        return day === todayLocal;
      })
      .map((r: ReminderProps) => ({
        id: r.id,
        text: r.name,
        time: r.time,
        status: (localStatuses[r.id] || "pending") as
          | "pending"
          | "completed"
          | "cancelled",
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [apiReminders, localStatuses]);

  const pendingCount = todayReminders.filter(
    (r) => r.status === "pending",
  ).length;

  const updateStatus = async (
    id: string,
    status: "pending" | "completed" | "cancelled",
  ) => {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
    if (status !== "pending") {
      try {
        await PutAPI(`/reminder/${id}`, { status }, true);
      } catch {
        // silent
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[2rem] border border-sky-100 bg-white/60 shadow-xl shadow-sky-900/5 backdrop-blur-xl",
        className,
      )}
    >
      {/* Brilho de fundo sutil */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-sky-100/50 bg-white/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
            <Bell className="h-5 w-5 text-white" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800">
              Lembretes de Hoje
            </h3>
            <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              {moment().format("DD [de] MMMM")}
            </p>
          </div>
        </div>
      </div>

      {/* List — altura natural, sem área flex que roube espaço do rodapé */}
      <div className="relative z-10 flex shrink-0 flex-col px-3 py-3">
        <AnimatePresence mode="popLayout">
          {isGettingReminders ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-0"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-12 animate-pulse rounded bg-sky-100" />
                    <div
                      className="h-4 animate-pulse rounded-lg bg-slate-100"
                      style={{ width: `${70 + (i % 2) * 15}%` }}
                    />
                  </div>
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ))}
            </motion.div>
          ) : todayReminders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-8"
            >
              <div className="rounded-2xl border border-sky-50 bg-white/50 p-4 shadow-sm">
                <Bell className="h-8 w-8 text-sky-200" />
              </div>
              <p className="text-sm font-medium text-slate-400">
                Sem lembretes hoje
              </p>
              <button
                onClick={onNewReminderClick}
                className="mt-2 flex items-center gap-1.5 rounded-lg border border-sky-100 bg-white/60 px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-colors hover:bg-white"
              >
                <Plus className="h-4 w-4" />
                Criar lembrete
              </button>
            </motion.div>
          ) : (
            todayReminders.slice(0, 6).map((reminder, idx) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all",
                  reminder.status === "pending"
                    ? "hover:bg-white/80 hover:shadow-md hover:shadow-sky-500/5"
                    : "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs font-bold tracking-wider uppercase",
                      reminder.status === "pending"
                        ? "text-sky-600"
                        : reminder.status === "completed"
                          ? "text-blue-500"
                          : "text-slate-400",
                    )}
                  >
                    {reminder.time}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm font-semibold",
                      reminder.status === "pending"
                        ? "text-slate-700"
                        : "text-slate-400 line-through",
                    )}
                    title={reminder.text}
                  >
                    {reminder.text}
                  </p>
                </div>

                {/* Actions sempre visíveis */}
                {reminder.status === "pending" && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(reminder.id, "completed");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Concluir"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(reminder.id, "cancelled");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="Excluir"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {reminder.status !== "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(reminder.id, "pending");
                    }}
                    className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
                  >
                    Desfazer
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      <button
        onClick={() => router.push("/reminders")}
        className="relative z-10 mt-1 mb-3 flex shrink-0 items-center gap-1 self-center rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-white/80 hover:shadow-sm active:scale-95"
      >
        Ver todos
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
