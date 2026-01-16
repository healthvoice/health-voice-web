"use client";
import { Calendar, Clock, FileAudio, Play } from "lucide-react";
import moment from "moment";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export function LastRecordingsSlider() {
  const recordings = [
    {
      id: 1,
      title: "Consulta com João Silva - Retorno",
      date: new Date(),
      duration: "45min",
      type: "Consulta",
    },
    {
      id: 2,
      title: "Estudo de Caso - Cardiologia",
      date: new Date(Date.now() - 86400000),
      duration: "1h 20min",
      type: "Estudo",
    },
    {
      id: 3,
      title: "Reunião de Equipe - Semanal",
      date: new Date(Date.now() - 172800000),
      duration: "30min",
      type: "Reunião",
    },
    {
      id: 4,
      title: "Anamnese Paciente 042",
      date: new Date(Date.now() - 259200000),
      duration: "15min",
      type: "Consulta",
    },
    {
      id: 5,
      title: "Lembrete: Ligar para Laboratório",
      date: new Date(Date.now() - 345600000),
      duration: "5min",
      type: "Lembrete",
    },
    {
      id: 6,
      title: "Discussão Clínica - Caso Raro",
      date: new Date(Date.now() - 432000000),
      duration: "55min",
      type: "Estudo",
    },
  ];

  return (
    <div className="flex w-full flex-col rounded-lg bg-gray-50 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FileAudio className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Últimas Gravações</h3>
        </div>
        <a
          href="/recordings"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todas
        </a>
      </div>

      <Swiper
        slidesPerView={1}
        spaceBetween={16}
        pagination={{
          clickable: true,
        }}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
        }}
        modules={[Pagination]}
        className="w-full !pb-8"
      >
        {recordings.map((recording) => (
          <SwiperSlide key={recording.id}>
            <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="bg-primary/10 text-primary group-hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:text-white">
                  <Play className="ml-1 h-5 w-5" />
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {recording.type}
                </span>
              </div>

              <h4 className="mb-2 line-clamp-2 font-bold text-gray-900">
                {recording.title}
              </h4>

              <div className="mt-auto flex items-center gap-3 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{moment(recording.date).format("DD/MM")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{recording.duration}</span>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
