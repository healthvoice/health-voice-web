"use client";

import { useApiContext } from "@/context/ApiContext";
import { cn } from "@/utils/cn";
import { Check, Copy, Loader2, Map, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import type { Especialidade } from "../page";

/**
 * Mapas agregados da clínica (H5) — panorama de um período para a direção.
 *
 * ⚠ O mapa é AGREGADO: fala de padrões, proporções e recorrências, nunca de
 * paciente individual. A API não envia nome de paciente para a IA e o prompt
 * proíbe identificar alguém — por isso esta tela pode ficar na área da
 * direção sem violar a regra de acesso a conteúdo clínico.
 */

interface TipoDeMapa {
  key: string;
  titulo: string;
}

interface ResultadoMapa {
  titulo: string;
  markdown: string;
  period: { startDate: string; endDate: string };
  stats: {
    recordingsInPeriod: number;
    recordingsIncluded: number;
    truncated: boolean;
  };
}

function isoDiasAtras(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export function MapasSecao({
  especialidades,
}: {
  especialidades: Especialidade[];
}) {
  const { GetAPI, PostAPI } = useApiContext();

  const [tipos, setTipos] = useState<TipoDeMapa[]>([]);
  const [mapType, setMapType] = useState("geral");
  const [departmentId, setDepartmentId] = useState("");
  const [startDate, setStartDate] = useState(isoDiasAtras(30));
  const [endDate, setEndDate] = useState(isoDiasAtras(0));
  const [customFocus, setCustomFocus] = useState("");
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMapa | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregarTipos = useCallback(async () => {
    const response = await GetAPI("/corporate/maps/types", true);
    if (response.status === 200 && Array.isArray(response.body)) {
      setTipos(response.body);
      if (response.body.length > 0) {
        setMapType((atual) =>
          response.body.some((t: TipoDeMapa) => t.key === atual)
            ? atual
            : response.body[0].key,
        );
      }
    }
  }, [GetAPI]);

  useEffect(() => {
    carregarTipos();
  }, [carregarTipos]);

  const gerar = async () => {
    setGerando(true);
    setResultado(null);
    const response = await PostAPI(
      "/corporate/maps/generate",
      {
        mapType,
        startDate,
        endDate,
        ...(departmentId ? { departmentId } : {}),
        ...(customFocus.trim() ? { customFocus: customFocus.trim() } : {}),
      },
      true,
    );
    setGerando(false);
    if (response.status === 200 || response.status === 201) {
      setResultado(response.body as ResultadoMapa);
    } else {
      toast.error(
        response.body?.message ??
          "Não foi possível gerar o mapa — verifique se há consultas no período.",
      );
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.markdown);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // clipboard indisponível
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Map size={17} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Mapas da clínica
          </h2>
          <p className="text-[11px] text-gray-500">
            Panorama de um período a partir das consultas transcritas.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Tipo de mapa</span>
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value)}
            className="focus:border-primary focus:ring-primary/10 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
          >
            {tipos.map((t) => (
              <option key={t.key} value={t.key}>
                {t.titulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">
            Especialidade (opcional)
          </span>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="focus:border-primary focus:ring-primary/10 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
          >
            <option value="">Clínica inteira</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Início</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="focus:border-primary focus:ring-primary/10 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Fim</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="focus:border-primary focus:ring-primary/10 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">
          Recorte adicional (opcional)
        </span>
        <input
          value={customFocus}
          onChange={(e) => setCustomFocus(e.target.value)}
          placeholder="Algo específico que a direção queira ver neste período"
          className="focus:border-primary focus:ring-primary/10 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-[11px] leading-relaxed text-gray-400">
          O mapa é agregado: fala de padrões e recorrências da clínica. Nenhum
          paciente é identificado, e ele não avalia conduta clínica.
        </p>
        <button
          onClick={gerar}
          disabled={gerando}
          className="bg-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {gerando ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {gerando ? "Analisando o período..." : "Gerar mapa"}
        </button>
      </div>

      {resultado && (
        <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {resultado.titulo}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {resultado.stats.recordingsIncluded} de{" "}
                {resultado.stats.recordingsInPeriod} consultas ·{" "}
                {resultado.period.startDate.split("-").reverse().join("/")} a{" "}
                {resultado.period.endDate.split("-").reverse().join("/")}
                {resultado.stats.truncated && " · período truncado por volume"}
              </p>
            </div>
            <button
              onClick={copiar}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[10px] font-semibold tracking-wider uppercase transition",
                copiado
                  ? "text-emerald-700"
                  : "text-gray-600 hover:border-gray-300 hover:text-gray-900",
              )}
            >
              {copiado ? <Check size={11} /> : <Copy size={11} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="prose prose-sm prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 mt-4 max-w-none">
            <ReactMarkdown>{resultado.markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  );
}
