"use client";
import { Plus, Video } from "lucide-react";
import moment from "moment";

export function MeetScheduleTable() {
  const meetings = [
    {
      id: 1,
      title: "Meet w/ Simmple",
      date: new Date(),
      startTime: "01:00 PM",
      endTime: "02:00 PM",
      type: "Remote",
    },
    {
      id: 2,
      title: "Fitness Training",
      date: new Date(),
      startTime: "02:00 PM",
      endTime: "03:00 PM",
      type: "In-person",
    },
    {
      id: 3,
      title: "Reading time",
      date: new Date(),
      startTime: "03:00 PM",
      endTime: "04:00 PM",
      type: "Personal",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-gray-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {moment().format("DD MMM")}
          </h3>
          <p className="text-sm text-gray-500">Reuniões agendadas</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 flex h-10 w-10 items-center justify-center rounded-full text-white transition">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-white"
          >
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
              <Video className="h-5 w-5" />
            </div>
            <div className="flex flex-1 flex-col">
              <h4 className="font-bold text-gray-900">{meeting.title}</h4>
              <p className="text-xs text-gray-500">
                {meeting.startTime} - {meeting.endTime}
              </p>
            </div>
          </div>
        ))}

        <div className="mt-4">
          <button className="bg-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition hover:opacity-90">
            <Video className="h-4 w-4" />
            Iniciar Nova Reunião
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 text-center">
        <a
          href="#"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todas as reuniões
        </a>
      </div>
    </div>
  );
}
