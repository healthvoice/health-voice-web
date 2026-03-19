"use client";
import { ClientProps } from "@/@types/general-client";
import { useGeneralContext } from "@/context/GeneralContext";
import { FileText } from "lucide-react";
import "moment/locale/pt-br";
import { useRouter } from "next/navigation";
import { useButtonTracking } from "@/hooks/useButtonTracking";

interface Props {
  client: ClientProps;
}

export function GeneralClientTableItem({ client }: Props) {
  const { setSelectedClient, recordingsFilters, setRecordingsFilters } =
    useGeneralContext();
  const router = useRouter();

  // Tracking de botões
  useButtonTracking();

  const handleNavigation = () => {
    setSelectedClient(client);
    setRecordingsFilters({
      ...recordingsFilters,
      clientId: client.id,
    });
    router.push(`/clients/${client.id}`);
  };

  const initials = client.name
    ? client.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const avatarColors = ["from-sky-400 to-blue-600"];
  const colorIndex = (client.name?.charCodeAt(0) ?? 0) % avatarColors.length;
  const avatarGradient = avatarColors[colorIndex];

  return (
    <div
      onClick={handleNavigation}
      data-tracking-id={`clients-card-${client.id}`}
      data-tracking-destination={`/clients/${client.id}`}
      className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-100 hover:shadow-xl hover:shadow-sky-500/10"
    >
      {/* Decorative top gradient bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${avatarGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Header: avatar + name */}
      <div className="flex items-center gap-4">
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient} shadow-lg transition-transform duration-300 group-hover:scale-105`}
        >
          <span className="text-lg font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-gray-900 transition-colors group-hover:text-sky-600">
            {client.name || "Sem nome"}
          </h3>
          {client.birthDate ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-sky-400" />
              <span>client.description</span>
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-gray-400">
              Sem descrição cadastrada
            </p>
          )}
        </div>
      </div>

      {/* Footer 
      <div className="flex items-center justify-end">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-all duration-300 group-hover:gap-2 group-hover:text-sky-600">
          Ver consultas
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>

      </div>
      */}
    </div>
  );
}
