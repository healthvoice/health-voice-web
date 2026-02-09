"use client";

import { useGeneralContext } from "@/context/GeneralContext";
import { Activity, Clock, Loader2, Mic, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { ContentPanel } from "./components/content-panel";
import { DateRangePicker } from "./components/date-range-picker";
import { KPICard } from "./components/kpi-card";
import { RecordingsChart } from "./components/recordings-chart";
import { UpcomingMeetings } from "./components/upcoming-meetings";
import { UpcomingReminders } from "./components/upcoming-reminders";
import { CompleteRegistrationModal } from "./components/complete-registration-modal";
import { TrialAppModal } from "./components/trial-app-modal";

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
  const { dashboardStats, isGettingDashboardStats, GetDashboardStats } =
    useGeneralContext();

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

  // Converter dados da API para o formato do gráfico
  const chartData = useMemo(() => {
    if (!dashboardStats?.recordingsByDay) {
      return [];
    }

    return dashboardStats.recordingsByDay.map((day) => {
      console.log(day, "day");
      const date = new Date(day.date + "T00:00:00");
      console.log(date, "date");
      console.log(date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }), "date.toLocaleDateString");
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
        : totalClients > 0 ? formattedAvgDuration : "—",
      subtitle: "média por contato",
      icon: Activity,
      variant: "info" as const,
      trend: { value: 0, isPositive: true }, // Este não tem trend específico
    },
  ];
  console.log(chartData, "chartData");
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="mb-4 flex w-full flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Acompanhe suas métricas e atividades
          </p>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            className={`delay-${index * 100}`}
          />
        ))}
      </div>

      {/* Charts and Meetings Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recordings Chart - takes 2 columns */}
        <div className="relative min-h-[400px] lg:col-span-2">
          {isGettingDashboardStats && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          )}
          <RecordingsChart data={chartData} className="h-full" />
        </div>

        {/* Upcoming Meetings - takes 1 column */}
        <UpcomingMeetings className="min-h-[400px]" />
      </div>

      {/* Reminders and Content Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Reminders - takes 1 column (same width as Meetings) */}
        <UpcomingReminders className="min-h-[400px]" />

        {/* Content Panel - takes 2 columns (same width as Chart) */}
        <ContentPanel className="min-h-[400px] lg:col-span-2" />
      </div>

      <CompleteRegistrationModal />
      <TrialAppModal />
    </div>
  );
}
