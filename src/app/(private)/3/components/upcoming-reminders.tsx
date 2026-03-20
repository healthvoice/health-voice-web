"use client";

import { ReminderProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlarmClock,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import moment from "moment";
import { useState, useRef, useEffect, useMemo } from "react";

interface LocalReminder {
  id: string;
  text: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
}

interface UpcomingRemindersProps {
  className?: string;
}

const ITEMS_PER_PAGE = 6;

export function UpcomingReminders({ className }: UpcomingRemindersProps) {
  const { PutAPI } = useApiContext();
  const {
    reminders: apiReminders,
    isGettingReminders,
    openNewRecording,
    setReminders,
  } = useGeneralContext();

  // Filtrar apenas os lembretes de hoje (comparar dia civil em UTC do lembrete com dia local de hoje)
  const todayReminders = useMemo(() => {
    const todayLocal = moment().format("YYYY-MM-DD");

    return apiReminders
      .filter((reminder: ReminderProps) => {
        const reminderDayUtc = moment.utc(reminder.date).format("YYYY-MM-DD");
        return reminderDayUtc === todayLocal;
      })
      .map(
        (reminder: ReminderProps): LocalReminder => ({
          id: reminder.id,
          text: reminder.name,
          time: reminder.time,
          status: "pending" as const,
        }),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [apiReminders]);

  const [localStatuses, setLocalStatuses] = useState<
    Record<string, "pending" | "completed" | "cancelled">
  >({});
  const [currentPage, setCurrentPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState<string>("");
  const [savingTimeId, setSavingTimeId] = useState<string | null>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Combinar dados da API com status local
  const reminders = useMemo(() => {
    return todayReminders.map((reminder) => ({
      ...reminder,
      status: localStatuses[reminder.id] || reminder.status,
    }));
  }, [todayReminders, localStatuses]);

  const totalPages = Math.ceil(reminders.length / ITEMS_PER_PAGE);
  const paginatedReminders = reminders.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  // Fechar editor ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        timeInputRef.current &&
        !timeInputRef.current.contains(event.target as Node)
      ) {
        setEditingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateStatus = (id: string, status: LocalReminder["status"]) => {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const updateTime = async (id: string) => {
    const newTime = tempTime.trim();
    if (!newTime) {
      setEditingId(null);
      return;
    }
    setSavingTimeId(id);
    try {
      const response = await PutAPI(`/reminder/${id}`, { time: newTime }, true);
      if (response.status === 200) {
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, time: newTime } : r)),
        );
        setEditingId(null);
      } else {
        console.error("Erro ao atualizar horário do lembrete:", response.status);
      }
    } catch (error) {
      console.error("Erro ao atualizar horário do lembrete:", error);
    } finally {
      setSavingTimeId(null);
    }
  };

  const handleAdd = () => {
    openNewRecording("PERSONAL", "REMINDER");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        "flex h-full min-h-[340px] flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:p-5",
        className,
      )}
    >
      {/* Header Clean */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-gray-800">
              Lembretes
            </h3>
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              Hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-sky-500/25 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </button>

          {totalPages > 1 && (
            <div className="flex items-center rounded-lg bg-gray-50 p-0.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista Refatorada */}
      <div className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {isGettingReminders ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-gray-300"
            >
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              <p className="text-sm font-medium text-gray-400">
                Carregando lembretes...
              </p>
            </motion.div>
          ) : paginatedReminders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-gray-300"
            >
              <div className="rounded-full bg-gray-50 p-4">
                <Bell className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">Nenhum lembrete para hoje</p>
            </motion.div>
          ) : (
            paginatedReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200",
                  reminder.status === "pending"
                    ? "border-transparent bg-gray-50/80 hover:border-sky-100 hover:bg-white hover:shadow-sm"
                    : reminder.status === "completed"
                      ? "border-transparent bg-green-50/40 opacity-75"
                      : "border-transparent bg-red-50/40 opacity-75",
                )}
              >
                {/* Time Badge */}
                <div className="relative shrink-0">
                  {editingId === reminder.id ? (
                    <div
                      ref={timeInputRef}
                      className="absolute -top-1 -left-1 z-10 flex items-center gap-1 rounded-lg border border-sky-200 bg-white p-1 shadow-lg"
                    >
                      <input
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="w-16 rounded bg-gray-50 px-1 py-0.5 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-sky-400"
                        autoFocus
                      />
                      <button
                        onClick={() => updateTime(reminder.id)}
                        disabled={savingTimeId === reminder.id}
                        className="rounded bg-sky-500 p-0.5 text-white hover:bg-sky-600 disabled:opacity-70"
                      >
                        {savingTimeId === reminder.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (reminder.status === "pending") {
                          setEditingId(reminder.id);
                          setTempTime(reminder.time);
                        }
                      }}
                      disabled={reminder.status !== "pending"}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors",
                        reminder.status === "pending"
                          ? "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 group-hover:text-blue-600 group-hover:ring-sky-200"
                          : reminder.status === "completed"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200",
                      )}
                    >
                      {reminder.status === "pending" ? (
                        <AlarmClock className="h-3 w-3" />
                      ) : reminder.status === "completed" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {reminder.time}
                    </button>
                  )}
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium transition-colors",
                      reminder.status === "pending"
                        ? "text-gray-700"
                        : "text-gray-400 line-through decoration-gray-300",
                    )}
                    title={reminder.text}
                  >
                    {reminder.text}
                  </p>
                </div>

                {/* Actions - Hover Only */}
                {reminder.status === "pending" && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => updateStatus(reminder.id, "completed")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                      title="Concluir"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(reminder.id, "cancelled")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {reminder.status !== "pending" && (
                  <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-50">
                    <button
                      onClick={() => updateStatus(reminder.id, "pending")}
                      className="text-xs font-medium text-gray-400 underline hover:text-gray-600"
                    >
                      Desfazer
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
