"use client";

import { CustomPagination } from "@/components/ui/blocks/custom-pagination";
import { useGeneralContext } from "@/context/GeneralContext";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { GeneralReminderCardItem } from "./general-reminder-card-item";

export function GeneralRemindersCards() {
  const {
    reminders,
    isGettingReminders,
    remindersFilters,
    setRemindersFilters,
    remindersTotalPages,
  } = useGeneralContext();

  // Aplicar filtros e ordenação localmente
  const filteredAndSortedReminders = useMemo(() => {
    let result = [...reminders];

    // Filtro de busca (query)
    if (remindersFilters.query) {
      const query = remindersFilters.query.toLowerCase();
      result = result.filter(
        (reminder) =>
          reminder.name.toLowerCase().includes(query) ||
          reminder.description.toLowerCase().includes(query)
      );
    }

    // Ordenação
    if (remindersFilters.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;

        switch (remindersFilters.sortBy) {
          case "NAME":
            comparison = a.name.localeCompare(b.name);
            break;
          case "DATE":
            comparison =
              new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case "TIME":
            comparison = (a.time || "").localeCompare(b.time || "");
            break;
          default:
            comparison = 0;
        }

        return remindersFilters.sortDirection === "DESC"
          ? -comparison
          : comparison;
      });
    }

    return result;
  }, [reminders, remindersFilters.query, remindersFilters.sortBy, remindersFilters.sortDirection]);

  const hasResults = filteredAndSortedReminders.length > 0;
  const showEmptyState = !isGettingReminders && !hasResults;

  return (
    <div className="flex flex-col gap-6">
      {/* Cards Grid */}
      <div className="min-h-[400px]">
        {isGettingReminders ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : hasResults ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedReminders.map((reminder, index) => (
                <GeneralReminderCardItem
                  key={reminder.id}
                  reminder={reminder}
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
                {remindersFilters.query
                  ? "Nenhum lembrete encontrado para esta busca"
                  : "Nenhum lembrete encontrado"}
              </h3>
              <p className="text-sm text-gray-500">
                {remindersFilters.query
                  ? "Tente buscar por outro termo."
                  : "Crie um novo lembrete para começar."}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {!isGettingReminders && remindersTotalPages > 1 && (
        <div className="flex justify-center p-4">
          <CustomPagination
            currentPage={remindersFilters.page}
            setCurrentPage={(page) =>
              setRemindersFilters((prev) => ({ ...prev, page }))
            }
            pages={remindersTotalPages}
            trackingPrefix="reminders"
          />
        </div>
      )}
    </div>
  );
}
