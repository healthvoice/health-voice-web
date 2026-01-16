"use client";

import { CustomPagination } from "@/components/ui/blocks/custom-pagination";
import { useGeneralContext } from "@/context/GeneralContext";
import { AnimatePresence, motion } from "framer-motion";
import debounce from "lodash.debounce";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { GeneralReminderCardItem } from "./general-reminder-card-item";

export function GeneralRemindersCards() {
  const {
    recordings,
    isGettingRecordings,
    recordingsFilters,
    setRecordingsFilters,
    recordingsTotalPages,
  } = useGeneralContext();

  // Reset filters on mount
  useEffect(() => {
    setRecordingsFilters((prev) => ({
      ...prev,
      clientId: undefined,
      query: undefined,
      sortBy: undefined,
      sortDirection: undefined,
      type: "REMINDER",
      page: 1,
    }));
  }, []);

  const [localQuery, setLocalQuery] = useState("");

  const handleStopTyping = (value: string) => {
    setRecordingsFilters((prev) => ({
      ...prev,
      query: value,
      page: 1,
    }));
  };

  const debouncedHandleStopTyping = useState(() =>
    debounce(handleStopTyping, 1000),
  )[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    debouncedHandleStopTyping(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}

      {/* Cards Grid */}
      <div className="min-h-[400px]">
        {isGettingRecordings ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : recordings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {recordings.map((recording, index) => (
                <GeneralReminderCardItem
                  key={recording.id}
                  reminder={recording}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nenhum lembrete encontrado
              </h3>
              <p className="text-sm text-gray-500">
                Crie uma nova gravação para começar.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {!isGettingRecordings && recordingsTotalPages > 1 && (
        <div className="flex justify-center p-4">
          <CustomPagination
            currentPage={recordingsFilters.page}
            setCurrentPage={(page) =>
              setRecordingsFilters((prev) => ({ ...prev, page }))
            }
            pages={recordingsTotalPages}
          />
        </div>
      )}
    </div>
  );
}
