"use client";

import { useApiContext } from "@/context/ApiContext";
import { useClinic } from "@/context/clinicContext";
import { cn } from "@/utils/cn";
import {
  Building2,
  ChevronRight,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ContextoCard } from "./components/contexto-card";
import { EspecialidadeModal } from "./components/especialidade-modal";
import { GlossarioSecao } from "./components/glossario-secao";
import { MapasSecao } from "./components/mapas-secao";
import { UnidadeModal } from "./components/unidade-modal";

/**
 * Área da Clínica (H1) — gestão da estrutura: contexto, unidades,
 * especialidades/setores e glossário clínico.
 *
 * Visível apenas para o diretor da clínica (COMPANY_ADMIN). Esconder a tela
 * é conveniência de navegação: quem garante o acesso é a API.
 *
 * ⚠ Esta área é ADMINISTRATIVA. Nenhum conteúdo clínico (paciente, áudio,
 * transcrição, resumo) aparece aqui — por decisão de produto, não por
 * limitação técnica.
 */

export interface Unidade {
  id: string;
  name: string;
  details?: string | null;
}

export interface Especialidade {
  id: string;
  name: string;
  details?: string | null;
  businessContext?: string | null;
  branchId?: string | null;
  _count?: { members: number };
}

type Aba = "estrutura" | "glossario" | "mapas";

export default function ClinicPage() {
  const { GetAPI, DeleteAPI } = useApiContext();
  const { isController, carregando: carregandoClinica, temClinica } = useClinic();

  const [aba, setAba] = useState<Aba>("estrutura");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [unidadeEmEdicao, setUnidadeEmEdicao] = useState<Unidade | null>(null);
  const [criandoUnidade, setCriandoUnidade] = useState(false);
  const [especialidadeEmEdicao, setEspecialidadeEmEdicao] =
    useState<Especialidade | null>(null);
  const [criandoEspecialidade, setCriandoEspecialidade] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resUnidades, resEspecialidades] = await Promise.all([
      GetAPI("/corporate/branches", true),
      GetAPI("/corporate/departments", true),
    ]);
    if (resUnidades.status === 200) setUnidades(resUnidades.body ?? []);
    if (resEspecialidades.status === 200)
      setEspecialidades(resEspecialidades.body ?? []);
    setCarregando(false);
  }, [GetAPI]);

  useEffect(() => {
    if (isController) carregar();
    else setCarregando(false);
  }, [isController, carregar]);

  const excluirUnidade = async (id: string) => {
    const response = await DeleteAPI(`/corporate/branches/${id}`, true);
    if (response.status === 200) {
      toast.success("Unidade removida");
      carregar();
    } else {
      toast.error("Não foi possível remover a unidade");
    }
  };

  const excluirEspecialidade = async (id: string) => {
    const response = await DeleteAPI(`/corporate/departments/${id}`, true);
    if (response.status === 200) {
      toast.success("Especialidade removida");
      carregar();
    } else {
      toast.error("Não foi possível remover a especialidade");
    }
  };

  if (carregandoClinica) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!temClinica || !isController) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-800">
          Área exclusiva da direção da clínica
        </p>
        <p className="max-w-sm text-xs text-gray-500">
          A gestão de unidades, especialidades e glossário fica com quem
          administra a clínica. Seus pacientes e consultas seguem normalmente
          nas outras telas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-[0.18em] text-gray-400 uppercase">
          Clínica
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Estrutura e contexto
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          O que a IA precisa saber sobre a clínica para gerar resumos melhores:
          unidades, especialidades e o vocabulário do dia a dia.
        </p>
      </header>

      <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1">
        {(
          [
            ["estrutura", "Estrutura"],
            ["glossario", "Glossário clínico"],
            ["mapas", "Mapas"],
          ] as [Aba, string][]
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              aba === valor
                ? "text-primary bg-white shadow-sm shadow-black/5"
                : "text-gray-500 hover:text-gray-800",
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === "estrutura" ? (
        <div className="flex flex-col gap-5">
          <ContextoCard />

          {/* Unidades */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                  <Building2 size={17} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Unidades
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Sedes, filiais e consultórios. Opcional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCriandoUnidade(true)}
                className="bg-primary inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={14} />
                Nova unidade
              </button>
            </div>

            {carregando ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Carregando...
              </div>
            ) : unidades.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-xs text-gray-500">
                Nenhuma unidade cadastrada. Clínicas com um só endereço podem
                seguir sem nenhuma.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {unidades.map((unidade) => (
                  <li
                    key={unidade.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3"
                  >
                    <button
                      onClick={() => setUnidadeEmEdicao(unidade)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {unidade.name}
                        </span>
                        {unidade.details && (
                          <span className="block truncate text-[11px] text-gray-500">
                            {unidade.details}
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        size={14}
                        className="ml-auto shrink-0 text-gray-300"
                      />
                    </button>
                    <button
                      onClick={() => excluirUnidade(unidade.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remover unidade"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Especialidades */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                  <Stethoscope size={17} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Especialidades e setores
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Cada uma tem seu contexto, suas IAs e seu glossário.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCriandoEspecialidade(true)}
                className="bg-primary inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={14} />
                Nova especialidade
              </button>
            </div>

            {carregando ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Carregando...
              </div>
            ) : especialidades.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-xs text-gray-500">
                Nenhuma especialidade cadastrada. Sem elas, as consultas usam o
                contexto geral da clínica.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {especialidades.map((especialidade) => {
                  const unidade = unidades.find(
                    (u) => u.id === especialidade.branchId,
                  );
                  return (
                    <li
                      key={especialidade.id}
                      className="group flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3"
                    >
                      <button
                        onClick={() => setEspecialidadeEmEdicao(especialidade)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {especialidade.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {unidade && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                              <Building2 size={9} />
                              {unidade.name}
                            </span>
                          )}
                          {typeof especialidade._count?.members === "number" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                              <Users size={9} />
                              {especialidade._count.members}
                            </span>
                          )}
                          {especialidade.businessContext && (
                            <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                              contexto
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={() => excluirEspecialidade(especialidade.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remover especialidade"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : aba === "glossario" ? (
        <GlossarioSecao especialidades={especialidades} />
      ) : (
        <MapasSecao especialidades={especialidades} />
      )}

      <UnidadeModal
        aberto={criandoUnidade || !!unidadeEmEdicao}
        unidade={unidadeEmEdicao}
        onFechar={() => {
          setCriandoUnidade(false);
          setUnidadeEmEdicao(null);
        }}
        onSalvo={() => {
          setCriandoUnidade(false);
          setUnidadeEmEdicao(null);
          carregar();
        }}
      />

      <EspecialidadeModal
        aberto={criandoEspecialidade || !!especialidadeEmEdicao}
        especialidade={especialidadeEmEdicao}
        unidades={unidades}
        onFechar={() => {
          setCriandoEspecialidade(false);
          setEspecialidadeEmEdicao(null);
        }}
        onSalvo={() => {
          setCriandoEspecialidade(false);
          setEspecialidadeEmEdicao(null);
          carregar();
        }}
      />
    </div>
  );
}
