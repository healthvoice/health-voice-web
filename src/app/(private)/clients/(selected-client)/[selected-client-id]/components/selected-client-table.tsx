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
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
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
  } = useGeneralContext();

  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);

  const GeneralRecordingsColumns = [
    { key: "NAME", label: "Título da Gravação", sortable: true },
    { key: "CREATED_AT", label: "Horário da Gravação", sortable: true },
    { key: "DURATION", label: "Tempo de Gravação", sortable: true },
    { key: "ACTIONS", label: "Ações", sortable: false },
  ];

  const applySortToFilters = (
    column: SortableColumn,
    direction: SortDirection,
  ) => {
    const sortField = direction ? column : undefined;
    const sortOrder = direction || undefined;

    setRecordingsFilters((prev) => ({
      ...prev,
      sortBy: (sortField as SortableColumn | undefined) || undefined,
      sortDirection: sortOrder || undefined,
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
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    if (sortDirection === "ASC")
      return <ChevronUp className="h-4 w-4 text-gray-600" />;
    if (sortDirection === "DESC")
      return <ChevronDown className="h-4 w-4 text-gray-600" />;
    return <ChevronUp className="h-4 w-4 text-gray-300" />;
  };

  useEffect(() => {
    setRecordingsFilters((prev) => ({
      ...prev,
      type: "CLIENT",
      query: undefined,
      sortBy: undefined,
      sortDirection: undefined,
      page: 1,
    }));
  }, []);

  return (
    <>
      {/* <SelectedClientTableHeader /> */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <Table wrapperClass="h-full">
          <TableHeader>
            <TableRow className="gap-1 bg-slate-100 hover:bg-slate-100">
              {GeneralRecordingsColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 text-xs font-semibold tracking-wider text-slate-600 uppercase",
                    column.sortable &&
                      "cursor-pointer select-none hover:text-slate-800",
                  )}
                  onClick={() =>
                    column.sortable && handleSort(column.key as SortableColumn)
                  }
                >
                  <div
                    className={cn(
                      "flex w-max items-center gap-2",
                      column.key === "ACTIONS" && "w-full justify-end",
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
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {GeneralRecordingsColumns.map((col, idx) => (
                      <TableCell
                        key={idx}
                        className="h-14 animate-pulse bg-zinc-50"
                      />
                    ))}
                  </TableRow>
                ))
              : !isGettingRecordings && recordings.length !== 0
                ? recordings.map((row) => (
                    <SelectedPatientTableItem key={row.id} recording={row} />
                  ))
                : !isGettingRecordings &&
                  recordings.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={GeneralRecordingsColumns.length}
                        className="h-24"
                      >
                        <div className="flex items-start text-start">
                          <AudioRecorder
                            buttonClassName="bg-primary hover:bg-primary/95 text-white mx-auto"
                            skipToClient
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
        {!isGettingRecordings && recordingsTotalPages > 1 && (
          <div className="border-t border-t-zinc-200 p-2">
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
    </>
  );
}
