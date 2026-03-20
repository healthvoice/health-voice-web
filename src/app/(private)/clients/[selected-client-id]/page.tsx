"use client";
import { AudioRecorder } from "@/components/audio-recorder/audio-recorder";
import { useGeneralContext } from "@/context/GeneralContext";
import { debounce } from "lodash";
import {
  ArrowLeft,
  Mic,
  Pencil,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import "moment/locale/pt-br";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ClientNotesTable } from "./components/client-notes-table";
import { EditClientModal } from "./components/edit-client-modal";
import { NewNoteModal } from "./components/new-note-modal";
import { SelectedClientTable } from "./components/selected-client-table";

export default function ClientConsultations() {
  const { setRecordingsFilters, selectedClient } = useGeneralContext();
  const [localQuery, setLocalQuery] = useState("");
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);
  const router = useRouter();

  const handleStopTyping = (value: string) => {
    setRecordingsFilters((prev) => ({
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

  const initials = selectedClient?.name
    ? selectedClient.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const avatarColors = ["from-sky-400 to-blue-600"];
  const colorIndex =
    (selectedClient?.name?.charCodeAt(0) ?? 0) % avatarColors.length;
  const avatarGradient = avatarColors[colorIndex];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/clients")}
        className="flex w-fit items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos os pacientes
      </button>

      {/* Patient profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 px-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-sm font-semibold text-white`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-gray-900 capitalize sm:text-2xl">
                {selectedClient?.name || "Paciente"}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 px-4 pb-1">
            <button
              type="button"
              onClick={() => setIsEditClientModalOpen(true)}
              className="text-primary flex w-full flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-white px-2 py-1 text-[13px] font-semibold shadow-lg shadow-black/10 transition-all duration-200 hover:bg-white/95 sm:w-auto"
            >
              <div className="flex h-9 shrink-0 items-center justify-center rounded-lg">
                <Pencil size={18} />
              </div>
              Editar paciente
            </button>
            <AudioRecorder
              skipToClient={true}
              customIcon={Mic}
              initialClientId={selectedClient?.id}
              customLabel="Nova consulta"
              buttonClassName="w-full justify-center py-1 gap-2 bg-primary text-white font-semibold text-[13px] rounded-xl shadow-lg shadow-black/10 hover:bg-primary/95 transition-all duration-200 sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════ CONSULTAS ═══════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-700">Consultas</h2>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar gravação..."
            value={localQuery}
            onChange={handleChange}
            className="h-9 w-56 rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-700 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:border-sky-400 focus:shadow-sky-500/10"
          />
        </div>
      </div>

      <SelectedClientTable />

      {/* ═══════════════════ NOTAS (OUTROS) ═══════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-gray-700">Notas</h2>
        </div>

        <button
          type="button"
          onClick={() => setIsNewNoteModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/95 hover:shadow-primary/30 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Nota
        </button>
      </div>

      <ClientNotesTable
        clientId={selectedClient?.id}
        refreshTrigger={notesRefreshTrigger}
      />

      <NewNoteModal
        open={isNewNoteModalOpen}
        onOpenChange={setIsNewNoteModalOpen}
        clientId={selectedClient?.id}
        onSuccess={() => setNotesRefreshTrigger((t) => t + 1)}
      />
      <EditClientModal
        open={isEditClientModalOpen}
        onOpenChange={setIsEditClientModalOpen}
        client={selectedClient}
      />
    </div>
  );
}
