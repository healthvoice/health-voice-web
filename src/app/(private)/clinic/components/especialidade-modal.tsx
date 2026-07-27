"use client";

import { useApiContext } from "@/context/ApiContext";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { Especialidade, Unidade } from "../page";

export function EspecialidadeModal({
  aberto,
  especialidade,
  unidades,
  onFechar,
  onSalvo,
}: {
  aberto: boolean;
  especialidade: Especialidade | null;
  unidades: Unidade[];
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const { PostAPI, PatchAPI } = useApiContext();
  const [nome, setNome] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [contexto, setContexto] = useState("");
  const [branchId, setBranchId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setNome(especialidade?.name ?? "");
    setDetalhes(especialidade?.details ?? "");
    setContexto(especialidade?.businessContext ?? "");
    setBranchId(especialidade?.branchId ?? "");
  }, [aberto, especialidade]);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  if (!montado || !aberto) return null;

  const salvar = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    const corpo = {
      name: nome.trim(),
      details: detalhes.trim() || undefined,
      businessContext: contexto.trim() || undefined,
      branchId: branchId || undefined,
    };
    const response = especialidade
      ? await PatchAPI(`/corporate/departments/${especialidade.id}`, corpo, true)
      : await PostAPI("/corporate/departments", corpo, true);
    setSalvando(false);
    if (response.status === 200 || response.status === 201) {
      toast.success(
        especialidade ? "Especialidade atualizada" : "Especialidade criada",
      );
      onSalvo();
    } else {
      toast.error("Não foi possível salvar a especialidade");
    }
  };

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
          className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {especialidade ? "Editar especialidade" : "Nova especialidade"}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Cardiologia, pediatria, recepção, faturamento…
              </p>
            </div>
            <button
              onClick={onFechar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Cardiologia"
                className="focus:border-primary focus:ring-primary/10 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
              />
            </label>

            {unidades.length > 0 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">
                  Unidade (opcional)
                </span>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="focus:border-primary focus:ring-primary/10 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
                >
                  <option value="">Sem unidade específica</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">
                Detalhes (opcional)
              </span>
              <input
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Descrição curta"
                className="focus:border-primary focus:ring-primary/10 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">
                Contexto para a IA (opcional)
              </span>
              <textarea
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                rows={4}
                placeholder="Protocolos, foco clínico, vocabulário próprio da especialidade…"
                className="focus:border-primary focus:ring-primary/10 w-full resize-y rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm leading-relaxed outline-none transition focus:ring-4"
              />
              <span className="text-[11px] text-gray-400">
                Soma ao contexto geral da clínica nos resumos desta
                especialidade. Não inclua dados de pacientes.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <button
              onClick={onFechar}
              className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={!nome.trim() || salvando}
              className="bg-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {salvando && <Loader2 size={12} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
