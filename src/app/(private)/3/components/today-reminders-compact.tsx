"use client";

import { ReminderProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, Check, Loader2, Plus, X } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface LocalStatus {
  [id: string]: "pending" | "completed" | "cancelled";
}

interface TodayRemindersCompactProps {
  className?: string;
}

export function TodayRemindersCompact({
  className,
}: TodayRemindersCompactProps) {
  const { PutAPI } = useApiContext();
  const router = useRouter();
  const {
    reminders: apiReminders,
    isGettingReminders,
    openNewRecording,
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className={cn(
        "flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm shadow-blue-500/20">
            <Bell className="h-4 w-4 text-white" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white ring-2 ring-white">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-800">
              Lembretes de Hoje
            </h3>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              {moment().format("DD [de] MMMM")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/reminders")}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-sky-50 active:scale-95"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col px-3 py-2">
        <AnimatePresence mode="popLayout">
          {isGettingReminders ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-8"
            >
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              <p className="text-sm text-gray-400">Carregando...</p>
            </motion.div>
          ) : todayReminders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2.5 py-8"
            >
              <div className="rounded-full bg-gray-50 p-3">
                <Bell className="h-6 w-6 text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                Sem lembretes hoje
              </p>
              <button
                onClick={() => openNewRecording("PERSONAL", "REMINDER")}
                className="flex items-center gap-1 text-sm font-medium text-sky-500 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
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
                transition={{ duration: 0.18, delay: idx * 0.04 }}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition-all",
                  reminder.status === "pending"
                    ? "hover:bg-sky-50/80 hover:shadow-sm"
                    : "opacity-55",
                )}
              >
                {/* Conteúdo: horário e nome um abaixo do outro */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs font-bold",
                      reminder.status === "pending"
                        ? "text-sky-600"
                        : reminder.status === "completed"
                          ? "text-blue-500"
                          : "text-gray-400",
                    )}
                  >
                    {reminder.time}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm font-medium",
                      reminder.status === "pending"
                        ? "text-gray-700"
                        : "text-gray-400 line-through",
                    )}
                    title={reminder.text}
                  >
                    {reminder.text}
                  </p>
                </div>

                {/* Actions sempre visíveis */}
                {reminder.status === "pending" && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(reminder.id, "completed");
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                      title="Concluir"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(reminder.id, "cancelled");
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                      title="Excluir"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {reminder.status !== "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(reminder.id, "pending");
                    }}
                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-600"
                  >
                    Desfazer
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
