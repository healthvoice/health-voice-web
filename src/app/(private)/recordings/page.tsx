"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { debounce } from "lodash";
import { Bell, Folder, GraduationCap, Search, Stethoscope } from "lucide-react";
import { useCallback, useState } from "react";
import { GeneralRecordingsTable } from "./components/general-recording-table";

type SortableColumn = "NAME" | "CREATED_AT" | "DURATION" | null;
type SortDirection = "ASC" | "DESC" | null;
export default function Recordings() {
  const { setRecordingsFilters, recordingsFilters } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");

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
    setLocalQuery(e.target.value);
    debouncedHandleStopTyping(e.target.value);
  };

  const handleTypeFilter = (
    type: "CLIENT" | "REMINDER" | "STUDY" | "OTHER" | undefined,
  ) => {
    setRecordingsFilters((prev) => ({
      ...prev,
      type: prev.type === type ? undefined : type, // Toggle off if clicked again
      page: 1,
    }));
  };

  const currentType = recordingsFilters?.type;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Últimas Gravações
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie todas as suas gravações
          </p>
        </div>
        <div className="flex h-max flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex h-max items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/50 p-1">
            <button
              onClick={() => handleTypeFilter("CLIENT")}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all",
                currentType === "CLIENT"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-100"
                  : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
              )}
            >
              <Stethoscope
                className={cn(
                  "h-3.5 w-3.5",
                  currentType === "CLIENT" && "fill-current",
                )}
              />
              Consulta
            </button>
            <button
              onClick={() => handleTypeFilter("REMINDER")}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all",
                currentType === "REMINDER"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-100"
                  : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
              )}
            >
              <Bell
                className={cn(
                  "h-3.5 w-3.5",
                  currentType === "REMINDER" && "fill-current",
                )}
              />
              Lembretes
            </button>
            <button
              onClick={() => handleTypeFilter("STUDY")}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all",
                currentType === "STUDY"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-100"
                  : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
              )}
            >
              <GraduationCap
                className={cn(
                  "h-3.5 w-3.5",
                  currentType === "STUDY" && "fill-current",
                )}
              />
              Estudos
            </button>
            <button
              onClick={() => handleTypeFilter("OTHER")}
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all",
                currentType === "OTHER"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-100"
                  : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
              )}
            >
              <Folder
                className={cn(
                  "h-3.5 w-3.5",
                  currentType === "OTHER" && "fill-current",
                )}
              />
              Outros
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-1">
            <div className="relative h-10 w-full sm:w-64 lg:w-80">
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
        </div>
      </div>
      <GeneralRecordingsTable />
    </div>
  );
}
