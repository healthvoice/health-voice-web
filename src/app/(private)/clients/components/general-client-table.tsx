"use client";
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
import { GeneralClientTableItem } from "./general-client-table-row";

type SortableColumn = "NAME" | "BIRTH_DATE" | "DESCRIPTION" | null;

type SortDirection = "ASC" | "DESC" | null;

export function GeneralClientsTable() {
  const {
    clients,
    isGettingClients,
    clientsFilters,
    setClientsFilters,
    clientsTotalPages,
    setRecordingsFilters,
  } = useGeneralContext();

  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null);
  const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false);

  const GeneralClientsColumns = [
    { key: "NAME", label: "Nome do Paciente", sortable: true },
    { key: "LAST_RECORDING", label: "Ultima gravação", sortable: true },
    { key: "DESCRIPTION", label: "Descrição", sortable: true },
    { key: "ACTIONS", label: "Ações", sortable: false },
  ];

  const applySortToFilters = (
    column: SortableColumn,
    direction: SortDirection,
  ) => {
    const sortField = direction ? column : undefined;
    const sortOrder = direction || undefined;

    setClientsFilters((prev) => ({
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
      type: undefined,
      sortDirection: undefined,
      sortBy: undefined,
      clientId: undefined,
      query: undefined,
      reminderId: undefined,
      page: 1,
    }));
    setClientsFilters({
      ...clientsFilters,
      page: 1,
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* <GeneralClientsTableHeader
        onOpenNewClient={() => setIsCreateClientSheetOpen(true)}
      /> */}

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <Table wrapperClass="h-full">
          <TableHeader>
            <TableRow className="gap-1 bg-gray-50/50 hover:bg-gray-50/50">
              {GeneralClientsColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 text-xs font-semibold tracking-wider text-gray-500 uppercase",
                    column.sortable &&
                      "cursor-pointer select-none hover:text-gray-700",
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
            {isGettingClients
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {GeneralClientsColumns.map((col, idx) => (
                      <TableCell
                        key={idx}
                        className="h-16 animate-pulse bg-gray-50"
                      />
                    ))}
                  </TableRow>
                ))
              : !isGettingClients && clients.length !== 0
                ? clients.map((row) => (
                    <GeneralClientTableItem key={row.id} client={row} />
                  ))
                : !isGettingClients &&
                  clients.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={GeneralClientsColumns.length}
                        className="h-64 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                          <span className="text-lg font-medium">
                            Nenhum paciente encontrado
                          </span>
                          <span className="text-sm">
                            Cadastre um novo paciente para começar
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
          </TableBody>
        </Table>
        {!isGettingClients && clientsTotalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <CustomPagination
              currentPage={clientsFilters.page}
              setCurrentPage={(page) =>
                setClientsFilters((prev) => ({ ...prev, page }))
              }
              pages={clientsTotalPages}
            />
          </div>
        )}
      </div>

      {/* {isCreateClientSheetOpen && (
        <CreateClientSheet
          isOpen={isCreateClientSheetOpen}
          onClose={() => setIsCreateClientSheetOpen(false)}
        />
      )} */}
    </div>
  );
}
