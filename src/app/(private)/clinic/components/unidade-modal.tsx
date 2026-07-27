"use client";

import { useApiContext } from "@/context/ApiContext";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { Unidade } from "../page";

export function UnidadeModal({
  aberto,
  unidade,
  onFechar,
  onSalvo,
}: {
  aberto: boolean;
  unidade: Unidade | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const { PostAPI, PatchAPI } = useApiContext();
  const [nome, setNome] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    setNome(unidade?.name ?? "");
    setDetalhes(unidade?.details ?? "");
  }, [aberto, unidade]);

  // Trava o scroll da página enquanto a modal está aberta
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
    const corpo = { name: nome.trim(), details: detalhes.trim() || undefined };
    const response = unidade
      ? await PatchAPI(`/corporate/branches/${unidade.id}`, corpo, true)
      : await PostAPI("/corporate/branches", corpo, true);
    setSalvando(false);
    if (response.status === 200 || response.status === 201) {
      toast.success(unidade ? "Unidade atualizada" : "Unidade criada");
      onSalvo();
    } else {
      toast.error("Não foi possível salvar a unidade");
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
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {unidade ? "Editar unidade" : "Nova unidade"}
            </h3>
            <button
              onClick={onFechar}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Unidade Centro, Consultório 2…"
                className="focus:border-primary focus:ring-primary/10 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-600">
                Detalhes (opcional)
              </span>
              <textarea
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                rows={3}
                placeholder="Endereço, horário de funcionamento, observações…"
                className="focus:border-primary focus:ring-primary/10 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:ring-4"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
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
