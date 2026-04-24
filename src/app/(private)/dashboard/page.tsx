"use client";

import { NewReminderModal } from "@/app/(private)/reminders/components/new-reminder-modal";
import { useApiContext } from "@/context/ApiContext";
import { useSession } from "@/context/auth";
import { useGeneralContext } from "@/context/GeneralContext";
import { TOUR_ENABLED, useRecordingTour } from "@/context/RecordingTourContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { startSession } from "@/services/analyticsService";
import { Activity, Clock, Loader2, Mic, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { ContentPanel } from "./components/content-panel";
import { DateRangePicker } from "./components/date-range-picker";
import { KPICard } from "./components/kpi-card";
import { RecordingsChart } from "./components/recordings-chart";
import { TrialAppModal } from "./components/trial-app-modal";
import { UpcomingMeetings } from "./components/upcoming-meetings";
import { UpcomingReminders } from "./components/upcoming-reminders";
import { UpgradePlanBanner } from "./components/upgrade-plan-banner";
import { WelcomeTourModal } from "./components/welcome-tour-modal";

// Helper para formatar data para API (YYYY-MM-DD)
const formatDateForAPI = (date: Date): string => {
  console.log("date", date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  console.log("response date", `${year}-${month}-${day}`);
  return `${year}-${month}-${day}`;
};

export default function HomePage() {
  const pathname = usePathname();
  const { profile } = useSession();
  const {
    dashboardStats,
    isGettingDashboardStats,
    GetDashboardStats,
    GetReminders,
  } = useGeneralContext();
  const { PostAPI } = useApiContext();
  const { startTour } = useRecordingTour();
  const [trialAppModalOpen, setTrialAppModalOpen] = useState<boolean | null>(
    null,
  );
  const [showWelcomeTourModal, setShowWelcomeTourModal] = useState(false);
  const [newReminderModalOpen, setNewReminderModalOpen] = useState(false);
  const prevTrialModalRef = useRef<boolean | null>(null);

  // Geolocalização
  const {
    latitude,
    longitude,
    fullData,
    error: geolocationError,
    isLoading: isLoadingLocation,
    requestLocation,
  } = useGeolocation();

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    return { from, to: today };
  });

  // Buscar stats quando dateRange mudar
  const fetchStats = useCallback(() => {
    if (dateRange?.from) {
      // Se não tiver "to", usar o mesmo dia que "from" (seleção de um único dia)
      const startDate = formatDateForAPI(dateRange.from);
      const endDate = formatDateForAPI(dateRange.to || dateRange.from);

      console.log(`[HomePage] Fetching stats: ${startDate} to ${endDate}`);

      GetDashboardStats({
        startDate,
        endDate,
      });
    }
  }, [dateRange, GetDashboardStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Mostra o modal de boas-vindas (e depois o tour) só quando a modal "Baixe o app" estiver fechada (e o tour estiver ativo)
  useEffect(() => {
    if (!TOUR_ENABLED) return;
    if (pathname !== "/") return;
    if (trialAppModalOpen !== false) return;
    const prev = prevTrialModalRef.current;
    if (prev !== true && prev !== null) return;
    prevTrialModalRef.current = false;
    const t = setTimeout(() => setShowWelcomeTourModal(true), 600);
    return () => clearTimeout(t);
  }, [pathname, trialAppModalOpen]);

  useEffect(() => {
    prevTrialModalRef.current = trialAppModalOpen;
  }, [trialAppModalOpen]);

  const handleWelcomeTourStart = useCallback(() => {
    setShowWelcomeTourModal(false);
    startTour(0);
  }, [startTour]);

  // Solicitar localização quando a página carregar
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Enviar localização para startSession quando disponível
  useEffect(() => {
    if (fullData) {
      startSession(PostAPI, fullData).catch((error) => {
        console.warn("Erro ao enviar localização na sessão:", error);
      });
    }
  }, [fullData, PostAPI]);

  // Converter dados da API para o formato do gráfico
  const chartData = useMemo(() => {
    if (!dashboardStats?.recordingsByDay) {
      return [];
    }

    return dashboardStats.recordingsByDay.map((day) => {
      console.log(day, "day");
      const date = new Date(day.date + "T00:00:00");
      console.log(date, "date");
      console.log(
        date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        "date.toLocaleDateString",
      );
      return {
        date: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        recordings: day.count,
      };
    });
  }, [dashboardStats]);

  // KPIs baseados nos dados reais
  const totalRecordings = dashboardStats?.totalRecordings || 0;
  const totalSeconds = dashboardStats?.totalSeconds || 0;
  const totalClients = dashboardStats?.totalClients || 0;

  // Formatar tempo gravado (mostrar minutos se for menos de 1 hora)
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formattedTotalDuration = formatDuration(totalSeconds);

  const avgSecondsPerClient = useMemo(() => {
    if (totalClients === 0) return 0;
    return totalSeconds / totalClients;
  }, [totalSeconds, totalClients]);

  const formattedAvgDuration = formatDuration(avgSecondsPerClient);

  // Calcular trends (comparação com período anterior)
  const calculateTrend = (
    current: number,
    previous: number,
  ): { value: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percentChange)),
      isPositive: percentChange >= 0,
    };
  };

  const recordingsTrend = useMemo(() => {
    return calculateTrend(
      totalRecordings,
      dashboardStats?.previousPeriod?.totalRecordings || 0,
    );
  }, [totalRecordings, dashboardStats]);

  const hoursTrend = useMemo(() => {
    return calculateTrend(
      totalSeconds,
      dashboardStats?.previousPeriod?.totalSeconds || 0,
    );
  }, [totalSeconds, dashboardStats]);

  const clientsTrend = useMemo(() => {
    return calculateTrend(
      totalClients,
      dashboardStats?.previousPeriod?.totalClients || 0,
    );
  }, [totalClients, dashboardStats]);

  // KPIs
  const kpis = [
    {
      title: "Quantidade de gravação",
      value: isGettingDashboardStats ? "..." : totalRecordings,
      subtitle: "no período selecionado",
      icon: Mic,
      variant: "primary" as const,
      trend: recordingsTrend,
    },
    {
      title: "Tempo gravado",
      value: isGettingDashboardStats ? "..." : formattedTotalDuration,
      subtitle: "total acumulado",
      icon: Clock,
      variant: "warning" as const,
      trend: hoursTrend,
    },
    {
      title: "Contatos atendidos",
      value: isGettingDashboardStats ? "..." : totalClients,
      subtitle: "pacientes únicos",
      icon: Users,
      variant: "success" as const,
      trend: clientsTrend,
    },
    {
      title: "Tempo por contato",
      value: isGettingDashboardStats
        ? "..."
        : totalClients > 0
          ? formattedAvgDuration
          : "—",
      subtitle: "média por contato",
      icon: Activity,
      variant: "info" as const,
      trend: { value: 0, isPositive: true }, // Este não tem trend específico
    },
  ];
  console.log(chartData, "chartData");

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Dashboard Header */}
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            Bem vindo(a),{" "}
            <span className="font-semibold text-gray-700">
              {profile?.name ?? "..."}
            </span>
          </p>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Upgrade Plan Banner */}
      <UpgradePlanBanner />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            className={`delay-${index * 100}`}
          />
        ))}
      </div>

      {/* Charts and Meetings Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recordings Chart - takes 2 columns */}
        <div className="relative min-h-[320px] lg:col-span-2">
          {isGettingDashboardStats && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          )}
          <RecordingsChart data={chartData} className="h-full" />
        </div>

        {/* Upcoming Meetings - takes 1 column */}
        <UpcomingMeetings className="min-h-[320px]" />
      </div>

      {/* Reminders and Content Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming Reminders - takes 1 column (same width as Meetings) */}
        <UpcomingReminders
          className="min-h-[320px]"
          onNewReminderClick={() => setNewReminderModalOpen(true)}
        />

        {/* Content Panel - takes 2 columns (same width as Chart) */}
        <ContentPanel className="min-h-[320px] lg:col-span-2" />
      </div>

      <NewReminderModal
        open={newReminderModalOpen}
        onOpenChange={setNewReminderModalOpen}
        onSuccess={GetReminders}
      />
      <TrialAppModal onOpenChange={setTrialAppModalOpen} />
      <WelcomeTourModal
        isOpen={showWelcomeTourModal}
        onStart={handleWelcomeTourStart}
      />
    </div>
  );
}
