"use client";

import { useApiContext } from "@/context/ApiContext";
import { Building2, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Contexto global da clínica — o bloco que a API injeta nos prompts de resumo
 * (CorporateContextService). Quanto melhor descrito, melhores os resumos.
 */
export function ContextoCard() {
  const { GetAPI, PatchAPI } = useApiContext();
  const [texto, setTexto] = useState("");
  const [original, setOriginal] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const response = await GetAPI("/corporate/company", true);
    if (response.status === 200 && response.body) {
      setNome(response.body.name ?? "");
      setTexto(response.body.businessContext ?? "");
      setOriginal(response.body.businessContext ?? "");
    }
    setCarregando(false);
  }, [GetAPI]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvar = async () => {
    setSalvando(true);
    const response = await PatchAPI(
      "/corporate/company",
      { businessContext: texto },
      true,
    );
    setSalvando(false);
    if (response.status === 200) {
      setOriginal(texto);
      toast.success("Contexto da clínica salvo");
    } else {
      toast.error("Não foi possível salvar o contexto");
    }
  };

  const alterado = texto !== original;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Building2 size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-gray-900">
            Sobre a clínica{nome ? ` — ${nome}` : ""}
          </h2>
          <p className="text-[11px] text-gray-500">
            Contexto que a IA usa ao resumir as consultas.
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          Carregando...
        </div>
      ) : (
        <>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder="Especialidades atendidas, perfil dos pacientes, convênios, forma de trabalho, o que diferencia o atendimento…"
            className="focus:border-primary focus:ring-primary/10 mt-4 w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-900 outline-none transition focus:ring-4"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-gray-400">
              Não inclua dados de pacientes aqui — este texto vai para todos os
              resumos da clínica.
            </p>
            <button
              onClick={salvar}
              disabled={!alterado || salvando}
              className="bg-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {salvando ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Salvar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
