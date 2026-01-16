"use client";
import { useGeneralContext } from "@/context/GeneralContext";
import { debounce } from "lodash";
import { Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { GeneralStudiesTable } from "./components/general-studies-table";

export default function Studies() {
  const { setRecordingsFilters, openNewRecording } = useGeneralContext();
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

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Estudos</h1>
          <p className="text-sm text-gray-500">
            Gerencie suas gravações de estudos
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
            onClick={() => openNewRecording("PERSONAL", "STUDY")}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Estudo
          </button>
        </div>
      </div>
      <GeneralStudiesTable />
    </div>
  );
}
