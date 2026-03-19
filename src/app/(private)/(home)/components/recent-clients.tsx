"use client";

import { ClientProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { ArrowRight, Plus, UserCircle2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
    return apiClients.slice(0, 4);
  }, [apiClients]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[2rem] border border-sky-100 bg-white/60 shadow-xl shadow-sky-900/5 backdrop-blur-xl",
        className,
      )}
    >
      {/* Brilho de fundo sutil */}
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-sky-100/50 bg-white/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-800">
              Pacientes Recentes
            </h3>
            <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              Acesso rápido
            </p>
          </div>
        </div>
      </div>

      {/* List — sem flex-1 para não comprimir e esconder o rodapé "Ver todos" */}
      <div className="relative z-10 flex shrink-0 flex-col px-3 py-3">
        {isGettingClients ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex w-full items-center gap-4 rounded-2xl px-3 py-3"
              >
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-sky-100" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-3/4 max-w-[140px] animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="rounded-2xl border border-sky-50 bg-white/50 p-4 shadow-sm">
              <UserCircle2 className="h-8 w-8 text-sky-200" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Nenhum paciente cadastrado
            </p>
            <button
              onClick={() => router.push("/clients?action=new")}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-sky-100 bg-white/60 px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-colors hover:bg-white"
            >
              <Plus className="h-4 w-4" />
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
                className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-all hover:bg-white/80 hover:shadow-md hover:shadow-sky-500/5 active:scale-[0.99]"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-[12px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-blue-500/30">
                  {initials}
                </div>
                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">
                    {client.name}
                  </p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 opacity-0 transition-all duration-300 group-hover:bg-sky-50 group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-sky-500" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>
      <button
        onClick={() => router.push("/clients")}
        className="relative z-10 mt-1 mb-3 flex shrink-0 items-center gap-1 self-center rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-all hover:bg-white/80 hover:shadow-sm active:scale-95"
      >
        Ver todos
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
