"use client";
import { CreateClientModal } from "@/components/ui/create-client-modal";
import { useGeneralContext } from "@/context/GeneralContext";
import { debounce } from "lodash";
import { Plus, Search, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { GeneralClientsTable } from "./components/general-client-table";

export default function Clients() {
  const { setClientsFilters } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");

  const handleStopTyping = (value: string) => {
    setClientsFilters((prev) => ({
      ...prev,
      query: value,
      page: 1,
    }));
  };

  const debouncedHandleStopTyping = useCallback(
    debounce(handleStopTyping, 600),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    debouncedHandleStopTyping(e.target.value);
  };

  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pacientes</h1>
            <p className="text-sm text-gray-500">
              Gerencie e acompanhe todos os seus pacientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={localQuery}
              onChange={handleChange}
              className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 shadow-sm outline-none transition-all focus:border-sky-400 focus:shadow-md focus:shadow-sky-500/10 placeholder:text-gray-400"
            />
          </div>

          {/* New patient button */}
          <button
            onClick={() => setIsCreateClientModalOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Table */}
      <GeneralClientsTable />

      <CreateClientModal
        open={isCreateClientModalOpen}
        onOpenChange={setIsCreateClientModalOpen}
      />
    </div>
  );
}
