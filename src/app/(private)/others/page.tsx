"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import { usePageView } from "@/hooks/usePageView";
import { debounce } from "lodash";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeneralOthersTable } from "./components/general-others-table";
import { NewPersonalRecordingModal } from "@/app/(private)/recordings/components/new-personal-recording-modal";
import { useApiContext } from "@/context/ApiContext";
import { useTrackingContext } from "@/context/TrackingContext";
import { Platform } from "@/services/analyticsService";

export default function Others() {
  const { setRecordingsFilters, GetRecordings } = useGeneralContext();
  const [newOtherModalOpen, setNewOtherModalOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const { PostAPI } = useApiContext();
  const { sessionId } = useTrackingContext();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Tracking de visualização de tela
  usePageView();
  const handleStopTyping = (value: string) => {
    setRecordingsFilters((prev) => ({
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
                  field: "others-search",
                  hasValue: true,
                  valueLength: value.length,
                },
              },
              true
            );

            if (process.env.NODE_ENV === "development") {
              console.log("📝 [Tracking] Campo de busca rastreado:", {
                field: "others-search",
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

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outras Gravações</h1>
          <p className="text-sm text-gray-500">
            Gerencie suas outras gravações
          </p>
        </div>
        <div className="flex flex-row items-center gap-4">
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
            onClick={() => setNewOtherModalOpen(true)}
            data-tracking-id="others-new-recording-button"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova Gravação
          </button>
        </div>
      </div>
      <GeneralOthersTable />
      <NewPersonalRecordingModal
        open={newOtherModalOpen}
        onOpenChange={setNewOtherModalOpen}
        variant="OTHER"
        onSuccess={GetRecordings}
      />
    </div>
  );
}
