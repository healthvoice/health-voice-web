"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import { useButtonTracking } from "@/hooks/useButtonTracking";
import { usePageView } from "@/hooks/usePageView";
import { cn } from "@/utils/cn";
import { debounce } from "lodash";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeneralRemindersCards } from "./components/general-reminder-cards";
import { NewReminderModal } from "./components/new-reminder-modal";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";

type SortableColumn = "NAME" | "DATE" | "TIME" | null;
type SortDirection = "ASC" | "DESC" | null;

export default function Reminders() {
  const { setRemindersFilters, GetReminders } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");
  const [newReminderModalOpen, setNewReminderModalOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Tracking de visualização de tela
  usePageView();
  // Tracking de botões
  useButtonTracking();

  const handleStopTyping = (value: string) => {
    setRemindersFilters((prev) => ({
      ...prev,
      query: value,
      page: 1,
    }));
  };

  const debouncedHandleStopTyping = useCallback(
    debounce(handleStopTyping, 1000),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedHandleStopTyping(value);

    // Tracking de debounce do campo de busca (500ms conforme guia)
    if (sessionId) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(async () => {
        try {
          if (value && value.length > 0) {
            await PostAPI(
              "/analytics/actions",
              {
                actionType: "BUTTON_CLICKED",
                platform: Platform.WEB,
                metadata: {
                  field: "reminders-search",
                  hasValue: true,
                  valueLength: value.length,
                },
              },
              true
            );

            if (process.env.NODE_ENV === "development") {
              console.log("📝 [Tracking] Campo de busca rastreado:", {
                field: "reminders-search",
                hasValue: true,
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ [Tracking] Erro ao rastrear campo de busca:", error);
          }
        }
      }, 500);
    }
  };

  // Cleanup do debounce
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSort = (column: SortableColumn) => {
    const nextDirection =
      sortColumn === column && sortDirection === "ASC" ? "DESC" : "ASC";

    setSortDirection(nextDirection);
    setSortColumn(column);

    setRemindersFilters((prev) => ({
      ...prev,
      sortBy: column || undefined,
      sortDirection: nextDirection || undefined,
      page: 1,
    }));
  };
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seus Lembretes</h1>
          <p className="text-sm text-gray-500">
            Gerencie todos os seus lembretes
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:items-center lg:gap-4">
          <div className="order-1 flex flex-1 items-center gap-2 gap-4 lg:order-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
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
              onClick={() => setNewReminderModalOpen(true)}
              data-tracking-id="reminders-new-reminder-button"
              className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Novo Lembrete
            </button>
          </div>
          <div className="order-2 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1 lg:order-1">
            <button
              onClick={() => handleSort("DATE")}
              data-tracking-id="reminders-sort-date"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:bg-white hover:shadow-sm",
                sortColumn === "DATE"
                  ? "text-primary bg-white shadow-sm"
                  : "text-gray-500",
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Data
            </button>
            <button
              onClick={() => handleSort("TIME")}
              data-tracking-id="reminders-sort-time"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:bg-white hover:shadow-sm",
                sortColumn === "TIME"
                  ? "text-primary bg-white shadow-sm"
                  : "text-gray-500",
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Horário
            </button>
          </div>
        </div>
      </div>
      <GeneralRemindersCards />
      <NewReminderModal
        open={newReminderModalOpen}
        onOpenChange={setNewReminderModalOpen}
        onSuccess={GetReminders}
      />
    </div>
  );
}
