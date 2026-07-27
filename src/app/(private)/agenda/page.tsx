"use client";

import { cn } from "@/utils/cn";
import { CalendarDays, Check, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { CompromissosLista } from "./components/compromissos-lista";
import { useGoogleCalendar } from "./use-google-calendar";

/**
 * Agenda (H2) — compromissos do Google Agenda do profissional, com preparação
 * de consulta a partir do histórico do paciente.
 *
 * Somente leitura: nada é criado ou alterado na agenda do Google, e nenhum
 * dado do convite é gravado no Health.
 */
export default function AgendaPage() {
  const google = useGoogleCalendar();

  // Resultado do OAuth chega em ?google=ok|erro|cancelado|sem-sessao
  useEffect(() => {
    const resultado = new URLSearchParams(window.location.search).get("google");
    if (!resultado) return;
    window.history.replaceState(null, "", "/agenda");
    if (resultado === "ok") {
      toast.success("Google Agenda conectada!");
    } else if (resultado === "cancelado") {
      toast("Conexão com o Google cancelada");
    } else if (resultado === "sem-sessao") {
      toast.error("Sessão expirada — entre novamente e conecte a agenda");
    } else {
      toast.error("Não foi possível conectar o Google Agenda — tente de novo");
    }
  }, []);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-[0.18em] text-gray-400 uppercase">
            Agenda
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Seus próximos atendimentos
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
            Conecte sua agenda para ver os compromissos aqui, preparar a
            consulta com o histórico do paciente e começar a gravar em um
            clique.
          </p>
        </div>

        <ChipConexao google={google} />
      </header>

      {google.carregando ? (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Verificando conexão...
        </div>
      ) : google.conectado ? (
        <CompromissosLista
          eventos={google.eventos}
          carregando={google.eventosCarregando}
          onRecarregar={google.recarregarEventos}
        />
      ) : (
        <ConviteConexao onConectar={google.conectar} />
      )}
    </div>
  );
}

function ChipConexao({
  google,
}: {
  google: ReturnType<typeof useGoogleCalendar>;
}) {
  if (google.carregando) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3">
        <Loader2 size={12} className="animate-spin text-gray-400" />
        <span className="text-[11px] font-medium text-gray-400">
          Google Agenda
        </span>
      </div>
    );
  }

  if (google.conectado) {
    return (
      <div className="group flex h-9 shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 pr-1 pl-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <Check size={12} />
          Agenda conectada
          {google.email && (
            <span className="hidden text-emerald-600/70 md:inline">
              · {google.email}
            </span>
          )}
        </span>
        <button
          onClick={google.desconectar}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald-700/60 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:opacity-100"
          aria-label="Desconectar"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={google.conectar}
      className="bg-primary inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold text-white transition hover:opacity-90"
    >
      <RefreshCw size={13} />
      Conectar Google Agenda
    </button>
  );
}

function ConviteConexao({ onConectar }: { onConectar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 px-6 py-12 text-center">
      <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
        <CalendarDays size={22} />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-800">
        Conecte sua agenda
      </p>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-gray-500">
        Seus compromissos aparecem aqui prontos para gravar, com os pacientes já
        reconhecidos pelo e-mail do convite. Acesso somente leitura — nada é
        criado ou alterado na sua agenda, e nenhum dado do convite é guardado.
      </p>
      <button
        onClick={onConectar}
        className={cn(
          "bg-primary mt-5 inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold text-white transition hover:opacity-90",
        )}
      >
        <RefreshCw size={13} />
        Conectar Google Agenda
      </button>
    </div>
  );
}
