"use client";

import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Clock, Crown, Loader2, Rocket, Shield, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import type { BillingCycle, PaymentMethod, Plan, ViewState } from "./types";
import { fmtBRL, getPlanCreditPrice, getPlanPixPrice, getRecordLabel } from "./utils";

interface PlansPageLayoutProps {
  viewState: ViewState;
  isTrial: boolean;
  selectedPlan: Plan | null;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  discountPercent: number;
  finalPrice: number;
  isFree: boolean;
  onBack: () => void;
  children: React.ReactNode;
  submitLoading?: boolean;
}

export function PlansPageLayout({
  viewState,
  isTrial,
  selectedPlan,
  billingCycle,
  paymentMethod,
  discountPercent,
  finalPrice,
  isFree,
  onBack,
  children,
  submitLoading = false,
}: PlansPageLayoutProps) {
  const isCheckout = viewState === "checkout";
  const isSuccess = viewState === "success";

  return (
    <div className="min-h-screen w-full bg-[#0b1829]">
      <div className="relative flex min-h-screen w-full flex-col bg-white lg:flex-row">
        {/* ═══ Background patterns ═══ */}
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[45%] h-[500px] w-[500px] rounded-full opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, rgba(13,120,236,0.6) 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] left-[42%] h-[600px] w-[600px] rounded-full opacity-[0.03]"
            style={{
              background:
                "radial-gradient(circle, rgba(14,116,237,0.4) 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-[30%] left-[47%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/[0.05]"
          />
        </div>

        {/* ═══ LEFT — Blue panel ═══ */}
        <div
          className={cn(
            "relative hidden h-screen shrink-0 flex-col overflow-hidden transition-[width] duration-500 ease-out lg:sticky lg:top-0 lg:flex",
            isSuccess ? "lg:w-0 lg:min-w-0" : "lg:w-[45%]",
          )}
          style={{
            background: "linear-gradient(145deg, #0d78ec 0%, #0a5fc4 40%, #1e3a8a 100%)",
          }}
        >
          {/* Background gradients */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 70% 80%, rgba(14,74,156,0.5) 0%, transparent 50%)",
              }}
            />
          </div>
          <div className="absolute inset-0 z-[1] bg-blue-950/20" />

          {/* Header */}
          <div
            className={cn(
              "absolute z-90 flex w-full shrink-0 items-center justify-between px-6 py-4 sm:px-8",
              isSuccess && "hidden",
            )}
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.12] p-6 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-xl transition hover:bg-white/25 hover:shadow-md"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex items-center justify-center">
              <Image
                src="/logos/logo2.png"
                alt="Health Voice"
                width={200}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          {/* Left panel patterns */}
          <div className="pointer-events-none absolute inset-0 z-[3]">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
            <motion.div
              animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -left-20 h-[28rem] w-[28rem] rounded-full bg-blue-300/[0.15] blur-[100px]"
            />
            <motion.div
              animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-16 bottom-[20%] h-[24rem] w-[24rem] rounded-full bg-indigo-400/[0.12] blur-[100px]"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-[10%] right-[10%] h-48 w-48"
            >
              <div className="h-full w-full rounded-full border border-white/[0.08]" />
              <div className="absolute inset-4 rounded-full border border-dashed border-white/[0.06]" />
            </motion.div>
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 4,
              }}
              className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent"
            />
          </div>

          {/* Left content */}
          <div className="relative z-10 flex h-full flex-col justify-center gap-6 p-10">
            {!isCheckout && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/20 bg-white/[0.10] p-6 backdrop-blur-xl"
              >
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {isTrial
                        ? "Desbloqueie o potencial completo"
                        : "Escolha o plano ideal"}
                    </h2>
                    <p className="text-sm text-white/95">
                      Transcrições inteligentes com IA
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    "Prontuários automáticos com IA",
                    "Suporte prioritário dedicado",
                  ].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2.5 text-sm text-white"
                    >
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {feat}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Selected plan info */}
            <AnimatePresence mode="wait">
              {selectedPlan && isCheckout && (
                <motion.div
                  key="plan-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-white/20 bg-white/[0.10] backdrop-blur-xl"
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/static/login.png"
                      alt={selectedPlan.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent" />
                    <div className="absolute right-4 bottom-4 left-4">
                      <p className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
                        Plano selecionado
                      </p>
                      <h3 className="text-xl font-bold text-white">
                        {selectedPlan.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-white/70">
                        {billingCycle === "YEARLY" ? "Cobrança anual" : "Cobrança mensal"}
                        {" · "}
                        {isFree
                          ? "GRÁTIS"
                          : fmtBRL(
                              discountPercent > 0
                                ? finalPrice
                                : paymentMethod === "pix"
                                  ? getPlanPixPrice(selectedPlan, billingCycle)
                                  : getPlanCreditPrice(selectedPlan, billingCycle),
                            )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              {selectedPlan && !isCheckout && (
                <motion.div
                  key={selectedPlan.id + billingCycle + paymentMethod}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden rounded-2xl border border-white/20 bg-white/[0.10] backdrop-blur-xl"
                >
                      <div className="flex items-center gap-4 border-b border-white/15 px-7 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                            Plano selecionado
                          </p>
                          <h3 className="text-xl font-bold text-white">
                            {selectedPlan.name}
                          </h3>
                        </div>
                      </div>
                      <div className="px-7 pt-6 pb-5">
                        {billingCycle === "YEARLY" ? (
                          <>
                            <span className="text-sm font-semibold text-white/60">
                              12x de
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-white">
                                {fmtBRL(
                                  (paymentMethod === "pix"
                                    ? getPlanPixPrice(selectedPlan, billingCycle)
                                    : getPlanCreditPrice(selectedPlan, billingCycle)) / 12,
                                )}
                              </span>
                              <span className="text-base font-medium text-white/60">
                                /mês
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight text-white">
                              {isFree
                                ? "GRÁTIS"
                                : discountPercent > 0
                                  ? fmtBRL(
                                      (paymentMethod === "pix"
                                        ? getPlanPixPrice(selectedPlan, billingCycle)
                                        : getPlanCreditPrice(selectedPlan, billingCycle)) *
                                        (1 - discountPercent / 100),
                                    )
                                  : fmtBRL(
                                      paymentMethod === "pix"
                                        ? getPlanPixPrice(selectedPlan, billingCycle)
                                        : getPlanCreditPrice(selectedPlan, billingCycle),
                                    )}
                            </span>
                            {!isFree && (
                              <span className="text-base font-medium text-white/60">
                                /mês
                              </span>
                            )}
                          </div>
                        )}
                        {discountPercent > 0 && !isFree && (
                          <p className="mt-1.5 text-sm font-medium text-emerald-400">
                            {discountPercent}% de desconto aplicado
                          </p>
                        )}
                      </div>
                      <div className="mx-7 space-y-0 divide-y divide-white/[0.06]">
                        <div className="flex items-center justify-between py-3.5">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-white/50" />
                            <span className="text-[15px] text-white/80">Ciclo</span>
                          </div>
                          <span className="text-[15px] font-semibold text-white">
                            {billingCycle === "YEARLY" ? "Anual" : "Mensal"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3.5">
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-white/50" />
                            <span className="text-[15px] text-white/80">Gravação</span>
                          </div>
                          <span className="text-[15px] font-semibold text-white">
                            {getRecordLabel(selectedPlan)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-5 border-t border-white/10 px-7 py-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-white/70">
                          <Shield className="h-3.5 w-3.5" /> Seguro
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-white/70">
                          <Zap className="h-3.5 w-3.5" /> Imediato
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-white/70">
                          <Clock className="h-3.5 w-3.5" /> Cancele quando quiser
                        </span>
                      </div>
                    </motion.div>
              )}
            </AnimatePresence>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-4 rounded-xl border border-white/20 bg-white/[0.10] px-5 py-3.5 backdrop-blur-md"
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sm text-[#F7CE46]">
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm font-bold text-white">4.9</span>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-sm text-white/90">
                +5.000 profissionais de saúde confiam
              </span>
            </motion.div>
          </div>
        </div>

        {/* ═══ RIGHT — Content panel ═══ */}
        <div className="relative flex min-h-screen flex-1 flex-col bg-[#f7f9ff]">
          {/* Right panel patterns */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 80% 50% at 20% 20%, rgba(13,120,236,0.04) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 60% at 80% 80%, rgba(30,64,175,0.03) 0%, transparent 50%)
                  `,
                }}
              />
            </div>
            <motion.div
              animate={{ x: ["-5%", "5%", "-5%"], y: ["-3%", "3%", "-3%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[5%] h-[60%] w-[120%]"
              style={{
                background:
                  "linear-gradient(135deg, transparent 25%, rgba(13,120,236,0.04) 38%, rgba(13,120,236,0.01) 50%, transparent 60%)",
                filter: "blur(35px)",
              }}
            />
          </div>

          {/* Mobile header */}
          <div className="relative z-10 flex items-center justify-between border-b border-blue-100 bg-white px-5 py-4 lg:hidden">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <Image
              src="/logos/logo-dark.png"
              alt="Health Voice"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <div className="w-16" />
          </div>

          {/* Scrollable content */}
          <div className="relative z-10 flex flex-col">
            <div
              className={cn(
                "mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 sm:px-8",
                isCheckout && "pb-40",
                !isCheckout && "min-h-screen",
              )}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {submitLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
              <p className="text-sm font-semibold text-gray-700">
                Processando pagamento...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
