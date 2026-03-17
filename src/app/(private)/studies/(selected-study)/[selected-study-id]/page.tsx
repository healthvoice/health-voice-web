"use client";

import { General } from "./components/general";

export default function SelectedStudySummary() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header — mesmo padrão da Transcrição */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumo Geral</h1>
          <p className="text-sm text-gray-500">
            Resumo geral da gravação com informações importantes.
          </p>
        </div>
      </div>
      {/* Card — mesmo padrão da Transcrição */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full max-w-none p-6">
          <General />
        </div>
      </div>
    </div>
  );
}
