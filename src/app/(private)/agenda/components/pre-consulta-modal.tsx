"use client";

import { useApiContext } from "@/context/ApiContext";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Loader2,
  MessageCircle,
  Mic,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  UserCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { contatosDoEvento, GoogleEvent } from "../use-google-calendar";

/**
 * Preparação de consulta (H2): briefing gerado do histórico REAL do paciente
 * — o que ficou pendente, pontos de atenção registrados e perguntas para
 * retomar o acompanhamento.
 *
 * ⚠ Não é diagnóstico nem conduta: organiza o que já foi registrado. Quem
 * decide é o profissional.
 *
 * Compromisso sem paciente reconhecido abre o vínculo manual — buscar ou criar
 * o paciente ali mesmo. Salvar o e-mail do convite no cadastro é escolha
 * explícita e desligada por padrão.
 */

const PADRAO = "__padrao__";

interface Briefing {
  primeiraConversa: boolean;
  objetivo: string;
  retomar: string[];
  cuidados: string[];
  perguntas: string[];
  baseadoEm: { recordingId: string; name: string; date: string }[];
  contatos: { id: string; name: string; empresa: string | null }[];
  promptIdUsado: string | null;
}

interface PromptOption {
  id: string;
  name: string;
  type: string;
}

interface PacienteOption {
  id: string;
  name: string;
}

export function PreConsultaModal({
  evento,
  onFechar,
  onGravar,
  onGerado,
}: {
  evento: GoogleEvent | null;
  onFechar: () => void;
  onGravar: (evento: GoogleEvent) => void;
  onGerado?: () => void;
}) {
  const { GetAPI, PostAPI, PutAPI } = useApiContext();

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [promptId, setPromptId] = useState<string>(PADRAO);

  const [escolhidos, setEscolhidos] = useState<PacienteOption[]>([]);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<PacienteOption[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [criando, setCriando] = useState(false);
  const [lembrarVinculo, setLembrarVinculo] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!evento) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [evento]);

  const idsDoEvento = evento ? contatosDoEvento(evento).map((c) => c.id) : [];
  const semPaciente = !!evento && idsDoEvento.length === 0;
  const clientIds = semPaciente ? escolhidos.map((c) => c.id) : idsDoEvento;

  const emailsDoConvite =
    evento?.attendees
      .map((c) => c.email)
      .filter((e): e is string => Boolean(e)) ?? [];
  const podeLembrar =
    semPaciente && emailsDoConvite.length === 1 && escolhidos.length === 1;

  const gerar = useCallback(
    async (ids: string[], prompt: string) => {
      if (!evento || ids.length === 0) return;
      setGerando(true);
      setErro(null);
      const response = await PostAPI(
        "/premeeting",
        {
          clientIds: ids,
          eventTitle: evento.title,
          eventId: evento.id,
          ...(prompt !== PADRAO ? { promptId: prompt } : {}),
        },
        true,
      );
      if (response.status === 200 || response.status === 201) {
        const corpo = response.body as Briefing;
        setBriefing(corpo);
        setPromptId(corpo.promptIdUsado ?? PADRAO);
        onGerado?.();
      } else {
        setErro("Não foi possível preparar a consulta — tente novamente.");
      }
      setGerando(false);
    },
    [evento, PostAPI, onGerado],
  );

  useEffect(() => {
    setBriefing(null);
    setErro(null);
    setEscolhidos([]);
    setBusca("");
    setResultados([]);
    setLembrarVinculo(false);
    setPromptId(PADRAO);
    if (!evento) return;

    let ativo = true;
    (async () => {
      if (evento.temBriefing) {
        const salvo = await GetAPI(`/premeeting/event/${evento.id}`, true);
        if (!ativo) return;
        if (salvo.status === 200 && salvo.body?.briefing) {
          setBriefing(salvo.body.briefing as Briefing);
          setPromptId(salvo.body.promptId ?? PADRAO);
          return;
        }
      }
      const ids = contatosDoEvento(evento).map((c) => c.id);
      if (ids.length > 0) gerar(ids, PADRAO);
    })();
    return () => {
      ativo = false;
    };
  }, [evento, gerar, GetAPI]);

  useEffect(() => {
    if (!evento || prompts.length > 0) return;
    (async () => {
      const response = await GetAPI("/prompts/available", true);
      if (response.status === 200) {
        setPrompts(
          (response.body as PromptOption[]).filter((p) => p.type === "CLIENT"),
        );
      }
    })();
  }, [evento, prompts.length, GetAPI]);

  useEffect(() => {
    if (!semPaciente) return;
    const q = busca.trim();
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      const response = await GetAPI(
        `/client?query=${encodeURIComponent(q)}&page=1`,
        true,
      );
      if (response.status === 200) {
        const lista = (response.body?.clients ?? []) as PacienteOption[];
        setResultados(
          lista
            .filter((c) => !escolhidos.some((e) => e.id === c.id))
            .slice(0, 6),
        );
      }
      setBuscando(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [busca, semPaciente, escolhidos, GetAPI]);

  if (!montado || !evento) return null;

  const criarPaciente = async () => {
    const nome = busca.trim();
    if (!nome) return;
    setCriando(true);
    const response = await PostAPI("/client", { name: nome }, true);
    setCriando(false);
    if (response.status === 200 || response.status === 201) {
      const bruto = (response.body?.client ?? response.body) as PacienteOption;
      if (bruto?.id) {
        setEscolhidos((prev) => [...prev, { id: bruto.id, name: bruto.name }]);
        setBusca("");
        setResultados([]);
        return;
      }
    }
    toast.error("Não foi possível criar o paciente");
  };

  const gerarComVinculo = async () => {
    if (clientIds.length === 0) return;
    if (podeLembrar && lembrarVinculo) {
      await PutAPI(
        `/client/${escolhidos[0].id}`,
        { email: emailsDoConvite[0] },
        true,
      );
    }
    gerar(clientIds, promptId);
  };

  const trocarIA = (novo: string) => {
    setPromptId(novo);
    if (briefing) gerar(clientIds, novo);
  };

  const seletorDeIA = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold tracking-[0.22em] text-gray-400 uppercase">
        IA da preparação
      </span>
      <select
        value={promptId}
        onChange={(e) => trocarIA(e.target.value)}
        className="focus:border-primary rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 outline-none transition"
      >
        <option value={PADRAO}>Padrão</option>
        {prompts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {briefing && !gerando && (
        <button
          onClick={() => gerar(clientIds, promptId)}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-[10px] font-semibold tracking-wider text-gray-600 uppercase transition hover:border-gray-300 hover:text-gray-900"
        >
          <Sparkles size={10} />
          Gerar novamente
        </button>
      )}
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onFechar}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase">
                <Stethoscope size={11} />
                Preparação de consulta
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">
                {evento.title}
              </h3>
              {briefing && briefing.contatos.length > 0 && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Paciente: {briefing.contatos.map((c) => c.name).join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={onFechar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {semPaciente && !briefing ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-gray-600">
                  Nenhum convidado deste compromisso é paciente seu ainda.{" "}
                  <span className="font-medium text-gray-800">
                    Com quem é este atendimento?
                  </span>{" "}
                  Vincule (ou cadastre) o paciente para preparar a consulta com
                  o histórico dele.
                </p>

                {escolhidos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {escolhidos.map((c) => (
                      <span
                        key={c.id}
                        className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      >
                        <UserCheck size={11} />
                        {c.name}
                        <button
                          onClick={() =>
                            setEscolhidos((prev) =>
                              prev.filter((e) => e.id !== c.id),
                            )
                          }
                          className="opacity-60 transition hover:opacity-100"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar paciente pelo nome..."
                    className="focus:border-primary focus:ring-primary/10 w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3.5 pl-9 text-sm outline-none transition focus:ring-4"
                  />
                </div>

                {busca.trim().length >= 2 && (
                  <div className="flex flex-col gap-1">
                    {buscando ? (
                      <p className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400">
                        <Loader2 size={12} className="animate-spin" />
                        Buscando...
                      </p>
                    ) : (
                      <>
                        {resultados.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setEscolhidos((prev) => [...prev, c]);
                              setBusca("");
                              setResultados([]);
                            }}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3.5 py-2 text-left text-sm text-gray-800 transition hover:border-gray-300"
                          >
                            {c.name}
                            <Plus size={13} className="text-gray-400" />
                          </button>
                        ))}
                        <button
                          onClick={criarPaciente}
                          disabled={criando}
                          className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3.5 py-2 text-left text-sm text-gray-600 transition hover:border-gray-400 hover:text-gray-900 disabled:opacity-60"
                        >
                          {criando ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Plus size={13} />
                          )}
                          Cadastrar paciente &quot;{busca.trim()}&quot;
                        </button>
                      </>
                    )}
                  </div>
                )}

                {podeLembrar && (
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={lembrarVinculo}
                      onChange={(e) => setLembrarVinculo(e.target.checked)}
                      className="accent-primary mt-0.5 h-4 w-4"
                    />
                    <span className="text-xs leading-relaxed text-gray-600">
                      <span className="font-medium text-gray-800">
                        Reconhecer automaticamente da próxima vez
                      </span>{" "}
                      — salva o e-mail do convite no cadastro deste paciente.
                      Sem marcar, nada do convite é gravado.
                    </span>
                  </label>
                )}

                {seletorDeIA}

                <button
                  onClick={gerarComVinculo}
                  disabled={clientIds.length === 0 || gerando}
                  className="bg-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {gerando ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  Preparar consulta
                </button>
                {erro && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erro}
                  </p>
                )}
              </div>
            ) : erro ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </p>
            ) : !briefing || gerando ? (
              <div className="flex flex-col items-center gap-3 py-10 text-sm text-gray-500">
                <Loader2 size={20} className="animate-spin" />
                Revisando o histórico das consultas anteriores...
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {seletorDeIA}

                {briefing.primeiraConversa && (
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
                    Ainda não há consultas gravadas com este paciente — este é
                    um roteiro de anamnese.
                  </p>
                )}

                <Bloco icone={Target} titulo="Objetivo do atendimento">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {briefing.objetivo}
                  </p>
                </Bloco>

                {briefing.retomar.length > 0 && (
                  <Bloco icone={ArrowRight} titulo="Retomar (ficou pendente)">
                    <Lista
                      itens={briefing.retomar}
                      tom="bg-gray-50 text-gray-700"
                    />
                  </Bloco>
                )}

                {briefing.cuidados.length > 0 && (
                  <Bloco icone={AlertTriangle} titulo="Pontos de atenção">
                    <Lista
                      itens={briefing.cuidados}
                      tom="bg-amber-50 text-amber-800"
                    />
                  </Bloco>
                )}

                {briefing.perguntas.length > 0 && (
                  <Bloco icone={MessageCircle} titulo="Perguntas sugeridas">
                    <Lista
                      itens={briefing.perguntas}
                      tom="bg-primary/5 text-gray-700"
                    />
                  </Bloco>
                )}

                {briefing.baseadoEm.length > 0 && (
                  <Bloco icone={FileText} titulo="Baseado nas consultas">
                    <div className="flex flex-col gap-1">
                      {briefing.baseadoEm.map((r) => (
                        <Link
                          key={r.recordingId}
                          href={`/recordings/${r.recordingId}`}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700 transition hover:border-gray-300"
                        >
                          <span className="truncate font-medium">{r.name}</span>
                          <span className="ml-2 shrink-0 text-gray-400">
                            {new Date(r.date).toLocaleDateString("pt-BR")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </Bloco>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <p className="max-w-sm text-[11px] leading-relaxed text-gray-400">
              Organiza o que já foi registrado — não é diagnóstico nem conduta.
              A decisão clínica é sua.
            </p>
            <button
              onClick={() => onGravar(evento)}
              className="bg-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Mic size={12} />
              Gravar consulta
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function Bloco({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Target;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.22em] text-gray-400 uppercase">
        <Icone size={11} />
        {titulo}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Lista({ itens, tom }: { itens: string[]; tom: string }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {itens.map((item) => (
        <li
          key={item}
          className={cn("rounded-xl px-3 py-2 text-xs leading-relaxed", tom)}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
