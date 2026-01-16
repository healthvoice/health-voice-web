"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Clock, FileAudio } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";

interface Props {
  reminder: RecordingDetailsProps;
  index: number;
}

export function GeneralReminderCardItem({ reminder, index }: Props) {
  const { setSelectedRecording } = useGeneralContext();
  const router = useRouter();

  const handleNavigation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedRecording(reminder);
    router.push(`/reminders/${reminder.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleNavigation}
      className="group hover:border-primary/20 hover:shadow-primary/5 relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header with Icon and Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-row items-center justify-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
            <FileAudio className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="group-hover:text-primary line-clamp-1 text-base font-bold text-gray-800 transition-colors">
              {reminder.name || "Sem título"}
            </h3>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="group-hover:bg-primary/5 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 transition-colors">
          <Calendar className="group-hover:text-primary/70 h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">
              Data
            </span>
            <span className="text-xs font-medium text-gray-700">
              {moment(reminder.createdAt).format("DD/MM/YYYY")}
            </span>
          </div>
        </div>

        <div className="group-hover:bg-primary/5 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 transition-colors">
          <Clock className="group-hover:text-primary/70 h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-400 uppercase">
              Duração
            </span>
            <span className="text-xs font-medium text-gray-700">
              {reminder.duration || "00:00"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="group-hover:text-primary/80 text-xs font-medium text-gray-400">
          {moment(reminder.createdAt).locale("pt-br").fromNow()}
        </span>

        <button
          onClick={handleNavigation}
          className="group-hover:bg-primary flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all duration-300 group-hover:text-white"
        >
          <span>Acessar</span>
          <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
}
