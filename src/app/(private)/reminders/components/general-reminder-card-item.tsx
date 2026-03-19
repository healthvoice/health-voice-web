"use client";

import { ReminderProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { useButtonTracking } from "@/hooks/useButtonTracking";
import { motion } from "framer-motion";
import { AlarmClock, Calendar, ChevronRight, FileAudio, Pencil } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditReminderModal } from "./edit-reminder-modal";

interface Props {
  reminder: ReminderProps;
  index: number;
}

export function GeneralReminderCardItem({ reminder, index }: Props) {
  const { setSelectedReminder } = useGeneralContext();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Tracking de botões
  useButtonTracking();

  const handleNavigation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedReminder(reminder);
    router.push(`/reminders/${reminder.id}`);
  };

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={handleNavigation}
        data-tracking-id={`reminders-card-${reminder.id}`}
        data-tracking-destination={`/reminders/${reminder.id}`}
        className="group hover:border-primary/20 hover:shadow-primary/5 relative flex cursor-pointer flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Header with Icon, Title and Date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-row items-center justify-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
              <FileAudio className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="group-hover:text-primary line-clamp-1 text-base font-bold text-gray-800 transition-colors">
                {reminder.name || "Sem título"}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Lembrete Personalizado
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              Data do Lembrete
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {moment.utc(reminder.date).format("DD/MM/YYYY")}
            </span>
          </div>
        </div>

        {/* Reminder Info Section */}
        <div className="flex flex-col gap-3 py-1">
          <div className="group-hover:bg-blue-50 flex items-center justify-between rounded-2xl bg-gray-50 p-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                <AlarmClock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Lembrar às:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {reminder.time || "--:--"}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              data-tracking-id={`reminders-card-${reminder.id}-edit-button`}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-gray-100 transition-all hover:bg-blue-600 hover:text-white hover:ring-blue-600"
            >
              <Pencil className="h-3 w-3" />
              Alterar
            </button>
          </div>
        </div>

        {/* Footer / Action */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-5">
          <span className="group-hover:text-primary/80 text-xs font-semibold text-gray-400">
            {reminder.recording ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {moment(reminder.recording.createdAt).locale("pt-br").fromNow()}
              </span>
            ) : (
              "Sem gravação"
            )}
          </span>

          <button
            onClick={handleNavigation}
            data-tracking-id={`reminders-card-${reminder.id}-access-button`}
            data-tracking-destination={`/reminders/${reminder.id}`}
            className="group-hover:bg-primary flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 transition-all duration-300 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/25"
          >
            <span>Acessar</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </motion.div>

      <EditReminderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reminder={reminder}
      />
    </>
  );
}
