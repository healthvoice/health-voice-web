"use client";

import { RecordingDetailsProps } from "@/@types/general-client";
import { CustomPagination } from "@/components/ui/blocks/custom-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/blocks/table";
import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Plus,
  StickyNote,
} from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SortableColumn = "NAME" | "CREATED_AT" | "DURATION" | null;
type SortDirection = "ASC" | "DESC" | null;

interface ClientNotesTableProps {
  clientId?: string;
  onNewNoteClick?: () => void;
  /** Quando muda, refaz a busca das notas (ex.: após criar uma nova) */
  refreshTrigger?: number;
}

export function ClientNotesTable({
  clientId: clientIdProp,
  onNewNoteClick,
  refreshTrigger,
}: ClientNotesTableProps) {
  const { selectedClient, setSelectedRecording } = useGeneralContext();
  const { GetAPI } = useApiContext();
  const clientId = clientIdProp ?? selectedClient?.id;

  const router = useRouter();
  const pathname = usePathname();
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);
  const [notesRecordings, setNotesRecordings] = useState<
    RecordingDetailsProps[]
  >([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const columns = [
    { key: "NAME", label: "Título da Nota", sortable: true },
    { key: "CREATED_AT", label: "Data", sortable: true },
    { key: "DURATION", label: "Duração", sortable: true },
    { key: "TRANSCRIPTION_STATUS", label: "Transcrição", sortable: false },
    { key: "ACTIONS", label: "", sortable: false },
  ];

  const transcriptionStatusConfig: Record<
    string,
    { label: string; className: string }
  > = {
    DONE: {
      label: "Transcrita",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    },
    TRANSCRIBING: {
      label: "Transcrevendo",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    },
    PENDING: {
      label: "Pendente",
      className: "bg-gray-50 text-gray-500 ring-1 ring-gray-300/50",
    },
    NOT_REQUESTED: {
      label: "Sem transcrição",
      className: "bg-gray-50 text-gray-400 ring-1 ring-gray-200",
    },
  };

  // Chamada específica: notas (other) por clientId
  const fetchNotes = useCallback(async () => {
    if (!clientId) return;
    setIsLoadingNotes(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("clientId", clientId);
      params.append("type", "OTHER"); // notas / outros (parâmetro other)
      if (sortColumn && sortDirection) {
        params.append("sortBy", sortColumn);
        params.append("sortDirection", sortDirection);
      }
      const response = await GetAPI(`/recording?${params.toString()}`, true);
      if (response.status === 200) {
        setNotesRecordings(response.body.recordings || []);
        setTotalPages(response.body.pages || 0);
      } else {
        setNotesRecordings([]);
        setTotalPages(0);
      }
    } catch {
      setNotesRecordings([]);
      setTotalPages(0);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [clientId, currentPage, sortColumn, sortDirection, GetAPI]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshTrigger]);

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
    setCurrentPage(1);
  };

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column)
      return <ChevronUp className="h-3.5 w-3.5 text-gray-300" />;
    if (sortDirection === "ASC")
      return <ChevronUp className="text-wite h-3.5 w-3.5" />;
    if (sortDirection === "DESC")
      return <ChevronDown className="h-3.5 w-3.5 text-white" />;
    return <ChevronUp className="h-3.5 w-3.5 text-gray-300" />;
  };

  const handleNavigation = (recording: RecordingDetailsProps) => {
    setSelectedRecording(recording);
    router.push(`${pathname}/${recording.id}`);
  };

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
            {isLoadingNotes
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-50">
                    {columns.map((col, idx) => (
                      <TableCell key={idx} className="py-4">
                        <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : notesRecordings.length > 0
                ? notesRecordings.map((recording) => {
                    const status =
                      transcriptionStatusConfig[
                        recording.transcriptionStatus
                      ] ?? transcriptionStatusConfig["PENDING"];

                    return (
                      <TableRow
                        key={recording.id}
                        onClick={() => handleNavigation(recording)}
                        className="group hover:bg-primary/5 h-[72px] cursor-pointer border-b border-gray-50 bg-white transition-all duration-200 hover:shadow-sm"
                      >
                        {/* Title */}
                        <TableCell className="w-[40%] py-3 pl-5 text-start">
                          <div className="flex items-center gap-3.5">
                            <div className="bg-primary shadow-primary/20 group-hover:shadow-primary/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-all duration-300 group-hover:scale-110">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="group-hover:text-primary text-sm font-semibold text-gray-900 transition-colors">
                                {recording.name || "Sem título"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {moment(recording.createdAt)
                                  .locale("pt-br")
                                  .format("DD [de] MMMM [de] YYYY")}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Date / Time */}
                        <TableCell className="py-3 text-start text-sm font-medium whitespace-nowrap text-gray-500">
                          {moment(recording.createdAt).format("HH:mm")}
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="py-3 text-start">
                          <span className="bg-primary/10 text-primary ring-primary/20 group-hover:bg-primary/15 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1">
                            {recording.duration || "—"}
                          </span>
                        </TableCell>

                        {/* Transcription status */}
                        <TableCell className="py-3 text-start">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
                              status.className,
                            )}
                          >
                            {status.label}
                          </span>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-3 pr-5 text-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigation(recording);
                            }}
                            className="group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm transition-all duration-200 hover:shadow-md"
                          >
                            Acessar
                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                : null}
          </TableBody>
        </Table>

        {/* Empty state */}
        {!isLoadingNotes && notesRecordings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
              <StickyNote className="text-primary h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                Nenhuma nota encontrada
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Adicione notas e gravações diversas para este paciente
              </p>
            </div>
            {onNewNoteClick && (
              <button
                onClick={onNewNoteClick}
                className="bg-primary shadow-primary/25 hover:bg-primary/95 hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Nova Nota
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoadingNotes && totalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <CustomPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}
