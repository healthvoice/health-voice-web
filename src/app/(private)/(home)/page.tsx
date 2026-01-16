"use client";

import { Activity, Clock, Mic, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { ContentPanel } from "./components/content-panel";
import { DateRangePicker } from "./components/date-range-picker";
import { KPICard } from "./components/kpi-card";
import { RecordingsChart } from "./components/recordings-chart";
import { UpcomingMeetings } from "./components/upcoming-meetings";
import { UpcomingReminders } from "./components/upcoming-reminders";

// Mock data - será substituído por dados reais da API
const generateMockChartData = (dateRange: DateRange | undefined) => {
  const days: {
    date: string;
    recordings: number;
    duration: number;
    contacts: number;
  }[] = [];

  if (!dateRange?.from || !dateRange?.to) {
    // Default: últimos 7 dias
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const recordings = Math.floor(Math.random() * 15) + 1;
      days.push({
        date: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
        recordings: recordings,
        duration: recordings * (Math.floor(Math.random() * 30) + 15), // 15-45 mins per recording
        contacts: Math.floor(recordings * 0.8), // 80% unique contacts
      });
    }
    return days;
  }

  const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < Math.min(diffDays, 30); i++) {
    const date = new Date(dateRange.from);
    date.setDate(dateRange.from.getDate() + i);
    const recordings = Math.floor(Math.random() * 15) + 1;
    days.push({
      date: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      recordings: recordings,
      duration: recordings * (Math.floor(Math.random() * 30) + 15),
      contacts: Math.floor(recordings * 0.8),
    });
  }

  return days;
};

export default function HomePage() {
  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    return { from, to: today };
  });

  // Generate chart data based on date range
  const chartData = useMemo(
    () => generateMockChartData(dateRange),
    [dateRange],
  );

  // Calculate KPIs based on chart data
  const totalRecordings = useMemo(
    () => chartData.reduce((acc, day) => acc + day.recordings, 0),
    [chartData],
  );

  const totalDurationMinutes = useMemo(
    () => chartData.reduce((acc, day) => acc + day.duration, 0),
    [chartData],
  );

  const totalContacts = useMemo(
    () => chartData.reduce((acc, day) => acc + day.contacts, 0),
    [chartData],
  );

  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMinutes = totalDurationMinutes % 60;

  const avgDurationPerContact = useMemo(() => {
    if (totalContacts === 0) return 0;
    return totalDurationMinutes / 60 / totalContacts;
  }, [totalDurationMinutes, totalContacts]);

  // Mock KPI data - será substituído por dados reais
  const kpis = [
    {
      title: "Quantidade de gravação",
      value: totalRecordings,
      subtitle: "no período selecionado",
      icon: Mic,
      variant: "primary" as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Horas gravadas",
      value: `${totalHours}h ${totalMinutes}m`,
      subtitle: "total acumulado",
      icon: Clock,
      variant: "warning" as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Contatos atendidos",
      value: totalContacts,
      subtitle: "pacientes únicos",
      icon: Users,
      variant: "success" as const,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Horas gravadas por contato",
      value: `${avgDurationPerContact.toFixed(1)}h`,
      subtitle: "média por contato",
      icon: Activity,
      variant: "info" as const,
      trend: { value: 2, isPositive: false },
    },
  ];

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
        <RecordingsChart
          data={chartData}
          className="min-h-[400px] lg:col-span-2"
        />

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
    </div>
  );
}
