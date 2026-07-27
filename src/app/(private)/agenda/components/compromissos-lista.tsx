"use client";

import { cn } from "@/utils/cn";
import {
  CalendarDays,
  Clock,
  Loader2,
  Mic,
  RefreshCw,
  Sparkles,
  UserCheck,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { contatosDoEvento, GoogleEvent } from "../use-google-calendar";
import { PreConsultaModal } from "./pre-consulta-modal";

/**
 * Compromissos dos próximos 14 dias. Pacientes reconhecidos (por e-mail do
 * convite, casado em memória) aparecem destacados; os demais convidados são
 * mostrados só pelo nome do convite — e-mail nunca aparece na tela.
 */

function formatarDia(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);
  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (mesmoDia(d, hoje)) return "Hoje";
  if (mesmoDia(d, amanha)) return "Amanhã";
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CompromissosLista({
  eventos,
  carregando,
  onRecarregar,
}: {
  eventos: GoogleEvent[];
  carregando: boolean;
  onRecarregar: () => void;
}) {
  const router = useRouter();
  const [preConsultaDe, setPreConsultaDe] = useState<GoogleEvent | null>(null);

  const gravar = (evento: GoogleEvent) => {
    // O gravador do Health vive na home; leva paciente e título prontos.
    const pacientes = contatosDoEvento(evento).map((c) => c.id);
    const params = new URLSearchParams({ titulo: evento.title });
    if (pacientes.length) params.set("paciente", pacientes[0]);
    router.push(`/?${params.toString()}`);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
            <CalendarDays size={17} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Próximos 14 dias
            </h2>
            <p className="text-[11px] text-gray-500">
              Direto da sua agenda do Google.
            </p>
          </div>
        </div>
        <button
          onClick={onRecarregar}
          disabled={carregando}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[10px] font-semibold tracking-wider text-gray-600 uppercase transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-60"
        >
          {carregando ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <RefreshCw size={11} />
          )}
          Atualizar
        </button>
      </div>

      {carregando && eventos.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Buscando seus compromissos...
        </div>
      ) : eventos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum compromisso com horário nos próximos 14 dias.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {eventos.map((evento) => {
            const pacientes = contatosDoEvento(evento);
            return (
              <li
                key={evento.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/40 p-3 md:flex-row md:items-center md:gap-4"
              >
                <div className="flex shrink-0 items-center gap-2 md:w-36 md:flex-col md:items-start md:gap-0.5">
                  <span className="text-xs font-semibold text-gray-900 capitalize">
                    {evento.start ? formatarDia(evento.start) : "—"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-500 tabular-nums">
                    <Clock size={10} />
                    {evento.start
                      ? `${formatarHora(evento.start)}${evento.end ? ` – ${formatarHora(evento.end)}` : ""}`
                      : "—"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {evento.title}
                    </p>
                    {evento.meetLink && (
                      <a
                        href={evento.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                      >
                        <Video size={9} />
                        Online
                      </a>
                    )}
                  </div>
                  {(evento.attendees.length > 0 ||
                    evento.vinculados.length > 0) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {/* E-mail de convidado NUNCA aparece na tela */}
                      {evento.attendees.map((convidado, i) => (
                        <span
                          key={`${evento.id}-${i}`}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            convidado.contactId
                              ? "bg-primary/10 text-primary"
                              : "bg-white text-gray-500 ring-1 ring-gray-200",
                          )}
                        >
                          {convidado.contactId && <UserCheck size={9} />}
                          {convidado.contactName ??
                            convidado.name ??
                            "Convidado"}
                        </span>
                      ))}
                      {evento.vinculados
                        .filter(
                          (v) =>
                            !evento.attendees.some((c) => c.contactId === v.id),
                        )
                        .map((v) => (
                          <span
                            key={`${evento.id}-v-${v.id}`}
                            className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          >
                            <UserCheck size={9} />
                            {v.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5 md:pl-2">
                  <button
                    onClick={() => setPreConsultaDe(evento)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[10px] font-semibold tracking-wider text-gray-700 uppercase transition hover:border-gray-300 hover:text-gray-900"
                  >
                    <Sparkles size={11} />
                    Pré-consulta
                  </button>
                  <button
                    onClick={() => gravar(evento)}
                    className="bg-primary inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold tracking-wider text-white uppercase transition hover:opacity-90"
                  >
                    <Mic size={11} />
                    Gravar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        Pacientes destacados foram reconhecidos pelo e-mail do convite. Nenhum
        dado da agenda é guardado no Health.
      </p>

      <PreConsultaModal
        evento={preConsultaDe}
        onFechar={() => setPreConsultaDe(null)}
        onGerado={onRecarregar}
        onGravar={(evento) => {
          setPreConsultaDe(null);
          gravar(evento);
        }}
      />
    </section>
  );
}
