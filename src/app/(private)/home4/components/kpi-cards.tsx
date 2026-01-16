"use client";
import { Activity, Clock, FileAudio, Users } from "lucide-react";

export function KPICards() {
  const kpis = [
    {
      label: "Total de Gravações",
      value: "1,234",
      icon: FileAudio,
      change: "+12.5%",
      trend: "up",
    },
    {
      label: "Horas Gravadas",
      value: "450h",
      icon: Clock,
      change: "+5.2%",
      trend: "up",
    },
    {
      label: "Novos Contatos",
      value: "89",
      icon: Users,
      change: "+8.1%",
      trend: "up",
    },
    {
      label: "Média de Horas/Usuário",
      value: "2.5h",
      icon: Activity,
      change: "-2.3%",
      trend: "down",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="flex flex-col justify-between rounded-lg bg-gray-50 p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">
                {kpi.value}
              </h3>
            </div>
            <div className="bg-primary/10 text-primary rounded-full p-3">
              <kpi.icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span
              className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}
            >
              {kpi.change}
            </span>
            <span className="ml-2 text-gray-400">vs. mês anterior</span>
          </div>
        </div>
      ))}
    </div>
  );
}
