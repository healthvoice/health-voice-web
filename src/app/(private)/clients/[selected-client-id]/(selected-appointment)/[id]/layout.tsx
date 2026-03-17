"use client";

import { useApiContext } from "@/context/ApiContext";
import { useGeneralContext } from "@/context/GeneralContext";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Bot,
  Calendar,
  ClipboardPlus,
  Clock,
  FileText,
  Loader2,
  ScrollText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ALL_TABS = [
  { label: "Resumo", icon: FileText, segment: "" },
  { label: "Insights", icon: Sparkles, segment: "overview" },
  { label: "Transcrição", icon: ScrollText, segment: "transcription" },
  { label: "Prontuário", icon: ClipboardPlus, segment: "medical-record" },
  { label: "Conversar", icon: Bot, segment: "chat" },
];
/** Notas (type OTHER) não têm prontuário — exibir apenas as outras abas */
const TABS_WITHOUT_MEDICAL_RECORD = ALL_TABS.filter(
  (t) => t.segment !== "medical-record",
);

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function AppointmentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    selectedClient,
    selectedRecording,
    setSelectedClient,
    setSelectedRecording,
  } = useGeneralContext();
  const { GetAPI } = useApiContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clientId = params["selected-client-id"] as string | undefined;
  const recordingId = params["id"] as string | undefined;

  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!clientId || !recordingId) {
      router.push("/clients");
      return;
    }

    const alreadyHasContext =
      selectedRecording?.id === recordingId && selectedClient?.id === clientId;
    if (alreadyHasContext) {
      setLoading(false);
      setResolved(true);
      return;
    }

    let cancelled = false;

    const loadFromApi = async () => {
      setLoading(true);
      const response = await GetAPI(`/recording/${recordingId}`, true);
      if (cancelled) return;

      if (response.status !== 200 || !response.body?.id) {
        router.push("/clients");
        return;
      }

      const recording = response.body;
      setSelectedRecording(
        recording as Parameters<typeof setSelectedRecording>[0],
      );
      if (recording.client) {
        setSelectedClient(
          recording.client as Parameters<typeof setSelectedClient>[0],
        );
      }
      setResolved(true);
      setLoading(false);
    };

    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, [
    clientId,
    recordingId,
    selectedRecording?.id,
    selectedClient?.id,
    GetAPI,
    router,
    setSelectedRecording,
    setSelectedClient,
  ]);

  // Nota não tem prontuário: redirecionar se estiver em /medical-record (sempre chamado para manter ordem de hooks)
  const base = `/clients/${clientId}/${recordingId}`;
  useEffect(() => {
    if (!resolved || !clientId || !recordingId) return;
    const isNote = selectedRecording?.type === "OTHER";
    if (isNote && pathname.includes("/medical-record")) {
      router.replace(base);
    }
  }, [resolved, clientId, recordingId, selectedRecording?.type, pathname, base, router]);

  if (!resolved && loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-400">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (!resolved) {
    return null;
  }

  const isNote = selectedRecording?.type === "OTHER";
  const tabs = isNote ? TABS_WITHOUT_MEDICAL_RECORD : ALL_TABS;
  const shouldRedirectToResumo =
    isNote && pathname.includes("/medical-record");

  if (shouldRedirectToResumo) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  const activeSegment = (() => {
    if (pathname === base || pathname === `${base}/`) return "";
    for (const tab of tabs) {
      if (tab.segment && pathname.includes(`/${tab.segment}`))
        return tab.segment;
    }
    return "";
  })();

  const initials = selectedClient?.name
    ? selectedClient.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  const formattedDate = formatDate(selectedRecording?.createdAt);
  const formattedDuration = selectedRecording?.duration;

  return (
    <div className="flex w-full flex-col gap-4">
      {/* ── HERO HEADER ── */}
      <button
        onClick={() => router.push(`/clients/${clientId}`)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as consultas
      </button>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-4 shadow-2xl shadow-blue-600/25">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute right-24 -bottom-10 h-36 w-36 rounded-full bg-white/5 blur-xl" />
        <div className="pointer-events-none absolute top-6 left-40 h-20 w-20 rounded-full bg-white/5 blur-lg" />

        <div className="relative flex flex-col gap-4">
          {/* Back button */}

          {/* Patient + Recording info */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full items-center gap-4">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                {initials}
              </div>

              <div className="flex flex-1 flex-row justify-between">
                <div className="flex flex-1 flex-col">
                  <h1 className="text-2xl leading-tight font-bold text-white capitalize">
                    {selectedClient?.name || "Paciente"}
                  </h1>
                  <p className="mt-0.5 truncate text-sm font-medium text-white/80">
                    {selectedRecording?.name || "Consulta"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {formattedDate && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </span>
                  )}
                  {formattedDuration && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      {formattedDuration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="scrollbar-hide flex items-center gap-4 overflow-x-auto rounded-2xl bg-gray-100/80 p-1.5">
        {tabs.map((tab) => {
          const isActive = activeSegment === tab.segment;
          const href = tab.segment ? `${base}/${tab.segment}` : base;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-white" : "text-gray-400",
                )}
              />
              <span className="hidden sm:block">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── PAGE CONTENT ── */}
      <div className="w-full">{children}</div>
    </div>
  );
}
