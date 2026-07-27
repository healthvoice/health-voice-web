"use client";

import { useApiContext } from "@/context/ApiContext";
import { BookMarked, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Especialidade } from "../page";

/**
 * Glossário clínico: siglas e termos que a transcrição precisa acertar
 * (HAS, DM2, IAM, nomes de medicamentos e protocolos).
 *
 * É aditivo: entrada sem especialidade vale para a clínica inteira; com
 * especialidade, soma às da clínica nas consultas daquela área.
 */

interface Entrada {
  id: string;
  term: string;
  meaning: string;
  aliases?: string | null;
  departmentId?: string | null;
}

export function GlossarioSecao({
  especialidades,
}: {
  especialidades: Especialidade[];
}) {
  const { GetAPI, PostAPI, DeleteAPI } = useApiContext();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [termo, setTermo] = useState("");
  const [significado, setSignificado] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const carregar = useCallback(async () => {
    const response = await GetAPI("/corporate/glossary", true);
    if (response.status === 200) setEntradas(response.body ?? []);
    setCarregando(false);
  }, [GetAPI]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionar = async () => {
    if (!termo.trim() || !significado.trim()) return;
    setSalvando(true);
    const response = await PostAPI(
      "/corporate/glossary",
      {
        term: termo.trim(),
        meaning: significado.trim(),
        departmentId: departmentId || undefined,
      },
      true,
    );
    setSalvando(false);
    if (response.status === 200 || response.status === 201) {
      setTermo("");
      setSignificado("");
      toast.success("Termo adicionado ao glossário");
      carregar();
    } else if (response.status === 409) {
      toast.error("Este termo já existe neste escopo");
    } else {
      toast.error("Não foi possível adicionar o termo");
    }
  };

  const remover = async (id: string) => {
    const response = await DeleteAPI(`/corporate/glossary/${id}`, true);
    if (response.status === 200) {
      toast.success("Termo removido");
      carregar();
    } else {
      toast.error("Não foi possível remover o termo");
    }
  };

  const nomeEspecialidade = (id?: string | null) =>
    id ? especialidades.find((e) => e.id === id)?.name : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <BookMarked size={17} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Glossário clínico
          </h2>
          <p className="text-[11px] text-gray-500">
            Siglas e termos que a transcrição precisa escrever certo.
          </p>
        </div>
      </div>

      {/* Adicionar */}
      <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-gray-50/60 p-3 md:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Termo (ex.: HAS)"
          className="focus:border-primary focus:ring-primary/10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-4"
        />
        <input
          value={significado}
          onChange={(e) => setSignificado(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
          placeholder="Significado (ex.: Hipertensão arterial sistêmica)"
          className="focus:border-primary focus:ring-primary/10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-4"
        />
        <div className="flex gap-2">
          {especialidades.length > 0 && (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="focus:border-primary rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none"
            >
              <option value="">Toda a clínica</option>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={adicionar}
            disabled={!termo.trim() || !significado.trim() || salvando}
            className="bg-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {salvando ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Adicionar
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          Carregando...
        </div>
      ) : entradas.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum termo cadastrado. Comece pelas siglas que a transcrição costuma
          errar.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {entradas.map((entrada) => {
            const especialidade = nomeEspecialidade(entrada.departmentId);
            return (
              <li
                key={entrada.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-2.5"
              >
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {entrada.term}
                  </span>
                  <span className="truncate text-xs text-gray-600">
                    {entrada.meaning}
                  </span>
                  {especialidade && (
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                      {especialidade}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => remover(entrada.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remover termo"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
