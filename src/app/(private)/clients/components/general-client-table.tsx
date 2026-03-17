"use client";
import { CustomPagination } from "@/components/ui/blocks/custom-pagination";
import { useGeneralContext } from "@/context/GeneralContext";
import { Users } from "lucide-react";
import { useEffect } from "react";
import { GeneralClientTableItem } from "./general-client-table-row";

export function GeneralClientsTable() {
  const {
    clients,
    isGettingClients,
    clientsFilters,
    setClientsFilters,
    clientsTotalPages,
    setRecordingsFilters,
  } = useGeneralContext();

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
    setClientsFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isGettingClients
          ? /* Skeleton cards */
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded-lg bg-gray-100" />
                  </div>
                </div>
                <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex justify-end">
                  <div className="h-3 w-24 animate-pulse rounded-lg bg-gray-100" />
                </div>
              </div>
            ))
          : clients.length > 0
            ? clients.map((client) => (
                <GeneralClientTableItem key={client.id} client={client} />
              ))
            : /* Empty state */
              null}
      </div>

      {/* Empty state (outside grid so it spans full width) */}
      {!isGettingClients && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100">
            <Users className="h-8 w-8 text-sky-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">
              Nenhum paciente encontrado
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Cadastre um novo paciente clicando em &ldquo;Novo Paciente&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isGettingClients && clientsTotalPages > 1 && (
        <div className="flex justify-center">
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
  );
}
