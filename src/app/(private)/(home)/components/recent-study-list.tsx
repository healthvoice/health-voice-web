"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar, Clock, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

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

interface RecentStudyListProps {
  className?: string;
}

export function RecentStudyList({ className }: RecentStudyListProps) {
  const router = useRouter();
  const { recordings: apiRecordings, isGettingRecordings } =
    useGeneralContext();

  const studies = useMemo(() => {
    return apiRecordings
      .filter((r: RecordingDetailsProps) => r.type === "STUDY")
      .slice(0, 6)
      .map((rec: RecordingDetailsProps) => {
        const createdAt = new Date(rec.createdAt);
        return {
          id: rec.id,
          name: rec.name,
          date: formatRelativeDate(createdAt),
          duration: rec.duration,
        };
      });
  }, [apiRecordings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className={cn(
        "flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 shadow-sm shadow-sky-500/20">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-800">
              Estudo
            </h3>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Materiais de estudo
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/studies")}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-sky-50 active:scale-95"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

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
              <p className="text-sm text-gray-400">Carregando...</p>
            </motion.div>
          ) : studies.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2.5 py-8"
            >
              <div className="rounded-full bg-sky-50 p-3">
                <BookOpen className="h-6 w-6 text-sky-200" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                Nenhum estudo ainda
              </p>
            </motion.div>
          ) : (
            studies.map((item, idx) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                onClick={() => router.push(`/studies/${item.id}`)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-all hover:bg-sky-50/50 active:scale-[0.99]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-sky-700">
                    {item.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </span>
                    {item.duration && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
