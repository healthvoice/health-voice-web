"use client";

import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { AlarmClock, Bell, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Reminder {
    id: string;
    text: string;
    time: string;
    status: "pending" | "completed" | "cancelled";
}

interface UpcomingRemindersProps {
    reminders?: Reminder[];
    className?: string;
}

// Mock data inicial
const mockReminders: Reminder[] = [
    { id: "1", text: "Ligar para Maria Silva", time: "09:00", status: "pending" },
    { id: "2", text: "Revisão de prontuário", time: "10:30", status: "pending" },
    { id: "3", text: "Relatório mensal", time: "11:00", status: "pending" },
    { id: "4", text: "Confirmar Dra. Ana", time: "14:00", status: "pending" },
    { id: "5", text: "Preparar reunião", time: "15:30", status: "pending" },
    { id: "6", text: "Responder e-mails", time: "16:00", status: "pending" },
    { id: "7", text: "Exames Pedro Lima", time: "17:00", status: "pending" },
    { id: "8", text: "Prescrições semana", time: "18:00", status: "pending" },
];

const ITEMS_PER_PAGE = 6;

export function UpcomingReminders({
    reminders: initialReminders = mockReminders,
    className,
}: UpcomingRemindersProps) {
    const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
    const [currentPage, setCurrentPage] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempTime, setTempTime] = useState<string>("");
    const timeInputRef = useRef<HTMLInputElement>(null);

    const totalPages = Math.ceil(reminders.length / ITEMS_PER_PAGE);
    const paginatedReminders = reminders.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    );

    // Fechar editor ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (timeInputRef.current && !timeInputRef.current.contains(event.target as Node)) {
                setEditingId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateStatus = (id: string, status: Reminder["status"]) => {
        setReminders(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    };

    const updateTime = (id: string) => {
        setReminders(prev => prev.map(r => (r.id === id ? { ...r, time: tempTime } : r)));
        setEditingId(null);
    };

    const handleAdd = () => {
        const newReminder: Reminder = {
            id: `new-${Date.now()}`,
            text: "Novo lembrete",
            time: "12:00",
            status: "pending",
        };
        setReminders(prev => [newReminder, ...prev]);
        setCurrentPage(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={cn(
                "flex h-full min-h-[460px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
                className
            )}
        >
            {/* Header Clean */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                            Lembretes
                        </h3>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
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
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {paginatedReminders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-gray-300"
                        >
                            <div className="rounded-full bg-gray-50 p-4">
                                <Bell className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">Lista vazia</p>
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
                                            : "border-transparent bg-red-50/40 opacity-75"
                                )}
                            >
                                {/* Time Badge */}
                                <div className="relative shrink-0">
                                    {editingId === reminder.id ? (
                                        <div
                                            ref={timeInputRef}
                                            className="absolute -left-1 -top-1 z-10 flex items-center gap-1 rounded-lg border border-sky-200 bg-white p-1 shadow-lg"
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
                                                className="rounded bg-sky-500 p-0.5 text-white hover:bg-sky-600"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (reminder.status === 'pending') {
                                                    setEditingId(reminder.id);
                                                    setTempTime(reminder.time);
                                                }
                                            }}
                                            disabled={reminder.status !== 'pending'}
                                            className={cn(
                                                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors",
                                                reminder.status === 'pending'
                                                    ? "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 group-hover:text-blue-600 group-hover:ring-sky-200"
                                                    : reminder.status === 'completed'
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                            )}
                                        >
                                            {reminder.status === 'pending' ? (
                                                <AlarmClock className="h-3 w-3" />
                                            ) : reminder.status === 'completed' ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <X className="h-3 w-3" />
                                            )}
                                            {reminder.time}
                                        </button>
                                    )}
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            "truncate text-sm font-medium transition-colors",
                                            reminder.status === "pending"
                                                ? "text-gray-700"
                                                : "text-gray-400 line-through decoration-gray-300"
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
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                            title="Concluir"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => updateStatus(reminder.id, "cancelled")}
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
                                            className="text-xs font-medium text-gray-400 hover:text-gray-600 underline"
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
