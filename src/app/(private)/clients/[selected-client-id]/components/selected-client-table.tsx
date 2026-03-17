"use client";
import { AudioRecorder } from "@/components/audio-recorder/audio-recorder";
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
import { ChevronDown, ChevronUp, Mic } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SelectedPatientTableItem } from "./selected-client-table-row";

type SortableColumn = "NAME" | "CREATED_AT" | "DURATION" | null;
type SortDirection = "ASC" | "DESC" | null;

export function SelectedClientTable() {
  const {
    recordings,
    isGettingRecordings,
    recordingsFilters,
    setRecordingsFilters,
    recordingsTotalPages,
    selectedClient,
  } = useGeneralContext();

  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);

  const columns = [
    { key: "NAME", label: "Título da Consulta", sortable: true },
    { key: "CREATED_AT", label: "Horário", sortable: true },
    { key: "DURATION", label: "Duração", sortable: true },
    { key: "TRANSCRIPTION_STATUS", label: "Transcrição", sortable: false },
    { key: "ACTIONS", label: "", sortable: false },
  ];

  const applySortToFilters = (
    column: SortableColumn,
    direction: SortDirection,
  ) => {
    setRecordingsFilters((prev) => ({
      ...prev,
      sortBy: direction ? (column as SortableColumn) : undefined,
      sortDirection: direction || undefined,
      page: 1,
    }));
  };

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
      applySortToFilters(column, next);
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
      applySortToFilters(column, "ASC");
    }
  };

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column)
      return <ChevronUp className="h-3.5 w-3.5 text-white" />;
    if (sortDirection === "ASC")
      return <ChevronUp className="h-3.5 w-3.5 text-white" />;
    if (sortDirection === "DESC")
      return <ChevronDown className="h-3.5 w-3.5 text-white" />;
    return <ChevronUp className="h-3.5 w-3.5 text-white" />;
  };

  useEffect(() => {
    setRecordingsFilters((prev) => ({
      ...prev,
      type: "CLIENT",
      clientId: selectedClient?.id ?? prev.clientId,
      query: undefined,
      sortBy: undefined,
      sortDirection: undefined,
      page: 1,
    }));
  }, [selectedClient?.id, setRecordingsFilters]);

  // Exibir apenas consultas (type CLIENT); notas (OTHER) ficam na seção de Notas
  const clientRecordings = useMemo(
    () => recordings.filter((r) => r.type === "CLIENT"),
    [recordings],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <Table wrapperClass="h-full">
          <TableHeader>
            <TableRow className="gap-1 bg-gradient-to-br from-sky-500 to-blue-600">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-11 text-xs font-semibold tracking-wide text-white/90 uppercase",
                    column.sortable &&
                      "cursor-pointer select-none hover:text-white",
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
            {isGettingRecordings
              ? /* Skeleton */
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-50">
                    {columns.map((col, idx) => (
                      <TableCell key={idx} className="py-4">
                        <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : clientRecordings.length > 0
                ? clientRecordings.map((row) => (
                    <SelectedPatientTableItem key={row.id} recording={row} />
                  ))
                : /* Empty state */
                  null}
          </TableBody>
        </Table>

        {/* Empty state inside the card */}
        {!isGettingRecordings && clientRecordings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100">
              <Mic className="h-7 w-7 text-sky-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                Nenhuma gravação encontrada
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Inicie uma nova consulta com este paciente
              </p>
            </div>
            <AudioRecorder
              buttonClassName="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 active:scale-95"
              skipToClient
            />
          </div>
        )}

        {/* Pagination - usa total de páginas do backend (já filtrado por type CLIENT) */}
        {!isGettingRecordings &&
          clientRecordings.length > 0 &&
          recordingsTotalPages > 1 && (
            <div className="border-t border-gray-100 p-4">
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
    </div>
  );
}
