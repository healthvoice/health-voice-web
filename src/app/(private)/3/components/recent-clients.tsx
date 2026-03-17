"use client";

import { ClientProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Plus, UserCircle2, Users } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface RecentClientsProps {
  className?: string;
}

export function RecentClients({ className }: RecentClientsProps) {
  const router = useRouter();
  const { clients: apiClients, isGettingClients } = useGeneralContext();

  const clients = useMemo(() => {
    return apiClients.slice(0, 6);
  }, [apiClients]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className={cn(
        "flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm shadow-blue-500/20">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-gray-800">
              Pacientes Recentes
            </h3>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Acesso rápido
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/clients")}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-sky-50 active:scale-95"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col px-3 py-2">
        {isGettingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <UserCircle2 className="h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              Nenhum paciente cadastrado
            </p>
            <button
              onClick={() => router.push("/clients?action=new")}
              className="mt-1 flex items-center gap-1 text-sm font-medium text-sky-500 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar paciente
            </button>
          </div>
        ) : (
          clients.map((client: ClientProps, idx: number) => {
            const initials = getInitials(client.name);
            return (
              <motion.button
                key={client.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all hover:bg-sky-50/80 hover:shadow-sm active:scale-[0.99]"
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-[11px] font-bold text-white shadow-sm">
                  {initials}
                </div>
                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-gray-700 group-hover:text-sky-700">
                    {client.name}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-sky-500" />
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
