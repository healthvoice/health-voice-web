"use client";

import { cn } from "@/utils/cn";
import { CheckCircle2, Mic, Sparkles } from "lucide-react";
import Image from "next/image";

interface WelcomeTourModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export function WelcomeTourModal({ isOpen, onStart }: WelcomeTourModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-[6px] p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col md:flex-row min-h-[480px] animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
        {/* Left: gradient + conteúdo (como completar cadastro) */}
        <div className="relative hidden w-1/2 md:block overflow-hidden bg-blue-900">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 to-blue-900/80" />

          <div className="absolute top-10 left-10 z-20">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md border border-white/20">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Tour guiado
              </span>
            </div>
          </div>

          <div className="absolute bottom-10 left-10 z-20 text-white max-w-md pr-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-3xl font-bold leading-tight tracking-tight">
              Vamos começar a <br /> usar o sistema.
            </h3>
            <p className="mt-4 text-base text-blue-100 opacity-90 leading-relaxed font-light">
              Em poucos passos você fará sua primeira gravação de consulta com a
              Health Voice.
            </p>
          </div>

          <div className="absolute bottom-10 right-10 z-20 flex items-center gap-2 text-white/80">
            <Mic className="h-5 w-5" />
            <span className="text-sm font-medium">Gravação guiada</span>
          </div>
        </div>

        {/* Right: conteúdo principal */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12 relative bg-white">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="mb-6">
                <Image
                  src="/logos/logo-dark.png"
                  alt="Health Voice"
                  width={180}
                  height={50}
                  className="h-auto w-auto max-h-[45px]"
                />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Bem-vindo!
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Bem-vindo e vamos começar a usar o sistema. Siga os passos para
                fazer sua primeira gravação de consulta.
              </p>
            </div>

            <button
              type="button"
              onClick={onStart}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2",
              )}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span>Vamos começar</span>
              <CheckCircle2 className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
