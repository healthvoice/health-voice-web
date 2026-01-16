"use client";
import { Bell, Calendar, ChevronRight, Clock } from "lucide-react";
import moment from "moment";

export function RecentRemindersCard() {
  const reminders = [
    {
      id: 1,
      title: "Revisar prontuário de João Silva",
      date: new Date(),
      priority: "high",
    },
    {
      id: 2,
      title: "Confirmar agendamento com Maria Oliveira",
      date: new Date(Date.now() + 86400000), // Tomorrow
      priority: "medium",
    },
    {
      id: 3,
      title: "Atualizar relatório mensal",
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      priority: "low",
    },
    {
      id: 4,
      title: "Ligar para Dr. Augusto",
      date: new Date(Date.now() + 259200000),
      priority: "high",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-gray-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Lembretes</h3>
          </div>
        </div>
        <a
          href="/reminders"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todos
        </a>
      </div>

      <div className="custom-scrollbar flex flex-col gap-3 overflow-y-auto pr-1">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="group hover:border-primary/20 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
          >
            <div
              className={
                reminder.priority === "high"
                  ? "h-full w-1 rounded-full bg-red-500"
                  : reminder.priority === "medium"
                    ? "h-full w-1 rounded-full bg-yellow-500"
                    : "h-full w-1 rounded-full bg-green-500"
              }
            ></div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h4 className="truncate text-sm font-semibold text-gray-900">
                {reminder.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{moment(reminder.date).format("DD MMM")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{moment(reminder.date).format("HH:mm")}</span>
                </div>
              </div>
            </div>
            <button className="hover:bg-primary flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
