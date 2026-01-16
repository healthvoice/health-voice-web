"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { debounce } from "lodash";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { GeneralRemindersCards } from "./components/general-reminder-cards";

type SortableColumn = "NAME" | "CREATED_AT" | "DURATION" | null;
type SortDirection = "ASC" | "DESC" | null;
export default function Reminders() {
  const { setRecordingsFilters, openNewRecording } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);

  const handleStopTyping = (value: string) => {
    setRecordingsFilters({
      query: value,
      page: 1,
      type: undefined,
      sortDirection: null,
      sortBy: null,
    });
  };

  const debouncedHandleStopTyping = useCallback(
    debounce(handleStopTyping, 1000),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    debouncedHandleStopTyping(e.target.value);
  };
  const handleSort = (column: SortableColumn) => {
    const nextDirection =
      sortColumn === column && sortDirection === "ASC" ? "DESC" : "ASC";

    setSortDirection(nextDirection);
    setSortColumn(column);

    setRecordingsFilters((prev) => ({
      ...prev,
      sortBy: column || undefined,
      sortDirection: nextDirection || undefined,
      page: 1,
    }));
  };
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seus Lembretes</h1>
          <p className="text-sm text-gray-500">
            Gerencie todos os seus lembretes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
            <button
              onClick={() => handleSort("CREATED_AT")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:bg-white hover:shadow-sm",
                sortColumn === "CREATED_AT"
                  ? "text-primary bg-white shadow-sm"
                  : "text-gray-500",
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Data
            </button>
            <button
              onClick={() => handleSort("DURATION")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:bg-white hover:shadow-sm",
                sortColumn === "DURATION"
                  ? "text-primary bg-white shadow-sm"
                  : "text-gray-500",
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Duração
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
            <div className="relative h-10 w-full sm:w-80">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={localQuery}
                onChange={handleChange}
                className="h-full w-full rounded-lg bg-transparent px-9 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            onClick={() => openNewRecording("PERSONAL", "REMINDER")}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Lembrete
          </button>
        </div>
      </div>
      <GeneralRemindersCards />
    </div>
  );
}
