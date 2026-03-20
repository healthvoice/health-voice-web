"use client";

import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { EASE, fmtBRL } from "./utils";

interface CheckoutFooterProps {
  show: boolean;
  priceLabel: string;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  isFree: boolean;
  billingCycle: "MONTHLY" | "YEARLY";
  paymentMethod: "card" | "pix";
  submitLoading: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => void;
}

export function CheckoutFooter({
  show,
  priceLabel,
  basePrice,
  discountPercent,
  finalPrice,
  isFree,
  billingCycle,
  paymentMethod,
  submitLoading,
  canSubmit,
  submitLabel,
  onSubmit,
}: CheckoutFooterProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="floating-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-[9999] border-t border-blue-100 bg-white/95 px-6 py-4 shadow-[0_-4px_20px_rgba(13,120,236,0.08)] backdrop-blur-md sm:px-8 lg:left-[45%]"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            {/* Resumo de preço */}
            <div className="min-w-0 flex-1">
              {priceLabel && (
                <p className="mb-0.5 truncate text-[11px] text-gray-400">
                  {priceLabel}
                </p>
              )}
              {discountPercent > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-300 line-through">
                    {fmtBRL(basePrice)}
                  </span>
                  <span className="text-lg font-bold text-black">
                    {isFree ? "GRÁTIS" : fmtBRL(finalPrice)}
                  </span>
                </div>
              ) : (
                <p className="text-lg font-bold text-black">
                  {billingCycle === "YEARLY" && paymentMethod === "card"
                    ? `12x de ${fmtBRL(basePrice / 12)}`
                    : fmtBRL(basePrice)}
                </p>
              )}
            </div>

            {/* Botão de ação */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitLoading || !canSubmit}
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold whitespace-nowrap shadow-lg transition-all",
                canSubmit && !submitLoading
                  ? "bg-primary text-white shadow-blue-600/25 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/30"
                  : "cursor-not-allowed bg-gray-100 text-gray-400 shadow-none",
              )}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  {submitLabel} {!isFree && <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-gray-400">
            Precisa de ajuda?{" "}
            <a
              href="https://wa.me/5511999999999?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Health%20Voice."
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 underline transition-colors hover:text-black"
            >
              Fale conosco
            </a>
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
