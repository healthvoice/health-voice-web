"use client";

import { CustomPagination } from "@/components/ui/blocks/custom-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/blocks/table";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import {
  AlarmClock,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
} from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SortableColumn = "NAME" | "DATE" | "TIME" | null;
type SortDirection = "ASC" | "DESC" | null;

export function ClientRemindersTable() {
  const {
    reminders,
    isGettingReminders,
    remindersFilters,
    setRemindersFilters,
    remindersTotalPages,
    selectedClient,
    setSelectedReminder,
    openNewRecording,
  } = useGeneralContext();

  const router = useRouter();
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);

  const columns = [
    { key: "NAME", label: "Título", sortable: true },
    { key: "DATE", label: "Data", sortable: true },
    { key: "TIME", label: "Horário", sortable: true },
    { key: "STATUS", label: "Status", sortable: false },
    { key: "ACTIONS", label: "", sortable: false },
  ];

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      const next =
        sortDirection === "ASC"
          ? "DESC"
          : sortDirection === "DESC"
            ? null
            : "ASC";
      setSortDirection(next || null);
      setSortColumn(next ? column : null);
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
    }
  };

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column)
      return <ChevronUp className="h-3.5 w-3.5 text-gray-300" />;
    if (sortDirection === "ASC")
      return <ChevronUp className="h-3.5 w-3.5 text-amber-500" />;
    if (sortDirection === "DESC")
      return <ChevronDown className="h-3.5 w-3.5 text-amber-500" />;
    return <ChevronUp className="h-3.5 w-3.5 text-gray-300" />;
  };

  // Filter reminders locally — only ones that belong to this client's recordings
  const filteredReminders = useMemo(() => {
    let result = [...reminders];

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
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
        }
        return sortDirection === "DESC" ? -comparison : comparison;
      });
    }

    return result;
  }, [reminders, sortColumn, sortDirection]);

  useEffect(() => {
    setRemindersFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [selectedClient?.id]);

  const handleNavigateToReminder = (reminder: (typeof reminders)[0]) => {
    setSelectedReminder(reminder);
    router.push(`/reminders/${reminder.id}`);
  };

  const isPast = (date: Date) => moment.utc(date).isBefore(moment(), "day");
  const isToday = (date: Date) => moment.utc(date).isSame(moment(), "day");

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <Table wrapperClass="h-full">
          <TableHeader>
            <TableRow className="border-b border-gray-100 bg-amber-50/50 hover:bg-amber-50/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-11 text-xs font-semibold tracking-wide text-gray-500 uppercase",
                    column.sortable &&
                      "cursor-pointer select-none hover:text-amber-600",
                    column.key === "ACTIONS" && "w-20",
                  )}
                  onClick={() =>
                    column.sortable && handleSort(column.key as SortableColumn)
                  }
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      column.key === "ACTIONS" && "justify-end",
                    )}
                  >
                    {column.label}
                    {column.sortable &&
                      getSortIcon(column.key as SortableColumn)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="relative">
            {isGettingReminders
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-50">
                    {columns.map((col, idx) => (
                      <TableCell key={idx} className="py-4">
                        <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredReminders.length > 0
                ? filteredReminders.map((reminder) => (
                    <TableRow
                      key={reminder.id}
                      onClick={() => handleNavigateToReminder(reminder)}
                      className="group h-[72px] cursor-pointer border-b border-gray-50 bg-white transition-all duration-200 hover:bg-amber-50/40 hover:shadow-sm"
                    >
                      {/* Name */}
                      <TableCell className="w-[35%] py-3 pl-5 text-start">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-amber-500/30">
                            <Bell className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-amber-700">
                              {reminder.name || "Sem título"}
                            </span>
                            <span className="line-clamp-1 text-xs text-gray-400">
                              {reminder.description || "Sem descrição"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 text-start">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {moment
                            .utc(reminder.date)
                            .locale("pt-br")
                            .format("DD [de] MMM, YYYY")}
                        </div>
                      </TableCell>

                      {/* Time */}
                      <TableCell className="py-3 text-start">
                        <div className="flex items-center gap-1.5">
                          <AlarmClock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">
                            {reminder.time || "--:--"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-start">
                        {isToday(reminder.date) ? (
                          <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/10">
                            Hoje
                          </span>
                        ) : isPast(reminder.date) ? (
                          <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 ring-1 ring-gray-200">
                            Passado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                            Agendado
                          </span>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3 pr-5 text-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToReminder(reminder);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm transition-all duration-200 group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-700 hover:shadow-md"
                        >
                          Acessar
                          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
          </TableBody>
        </Table>

        {/* Empty state */}
        {!isGettingReminders && filteredReminders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
              <Bell className="h-7 w-7 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                Nenhum lembrete encontrado
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Crie um novo lembrete para este paciente
              </p>
            </div>
            <button
              onClick={() => openNewRecording("PERSONAL", "REMINDER")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Novo Lembrete
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isGettingReminders && remindersTotalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <CustomPagination
              currentPage={remindersFilters.page}
              setCurrentPage={(page) =>
                setRemindersFilters((prev) => ({ ...prev, page }))
              }
              pages={remindersTotalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}
