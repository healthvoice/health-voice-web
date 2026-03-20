"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  Crown,
  CreditCard,
  Loader2,
  QrCode,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import type { BillingCycle, Plan } from "./types";
import { fmtBRL, getPlanCreditPrice, getPlanPixPrice } from "./utils";

interface PlansSectionProps {
  plans: Plan[];
  loadingPlans: boolean;
  billingCycle: BillingCycle;
  selectedPlan: string | null;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onPlanSelect: (planId: string) => void;
  onContinue: () => void;
}

export function PlansSection({
  plans,
  loadingPlans,
  billingCycle,
  selectedPlan,
  onBillingCycleChange,
  onPlanSelect,
  onContinue,
}: PlansSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col items-center justify-center gap-8 py-8"
    >
      <div className="w-full text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
          Escolha seu plano
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Selecione o plano ideal e desbloqueie todo o potencial do Health
          Voice.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="inline-flex rounded-full bg-white p-1.5 shadow-sm ring-1 ring-blue-100">
        <button
          onClick={() => onBillingCycleChange("MONTHLY")}
          className={cn(
            "rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
            billingCycle === "MONTHLY"
              ? "bg-primary text-white shadow-md shadow-blue-500/30"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Mensal
        </button>
        <button
          onClick={() => onBillingCycleChange("YEARLY")}
          className={cn(
            "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all",
            billingCycle === "YEARLY"
              ? "bg-primary text-white shadow-md shadow-blue-500/30"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Anual
          <span className="rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -20%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      {loadingPlans ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-5">
          {plans.map((plan, i) => {
            const isSelected = selectedPlan === plan.id;
            const price = getPlanCreditPrice(plan, billingCycle);
            const pixPrice = getPlanPixPrice(plan, billingCycle);
            const isPopular = plans.length >= 2 && i === 1;

            return (
              <motion.button
                key={plan.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPlanSelect(plan.id)}
                className={cn(
                  "group relative flex flex-col items-center rounded-3xl p-8 text-center transition-all duration-300",
                  isSelected
                    ? "bg-gradient-to-br from-[#0d78ec] to-[#1e40af] shadow-2xl ring-2 shadow-blue-600/30 ring-[#0d78ec]"
                    : "bg-white shadow-lg ring-1 shadow-gray-200/50 ring-gray-100 hover:shadow-xl hover:ring-blue-200",
                  isPopular && !isSelected && "ring-2 ring-[#0d78ec]/30",
                )}
              >
                {isPopular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-b-xl bg-gradient-to-r from-[#0d78ec] to-[#1e40af] px-4 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg shadow-blue-400/40">
                      <Crown className="h-3 w-3" /> POPULAR
                    </span>
                  </div>
                )}

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                  >
                    <Check className="h-4 w-4 text-black" />
                  </motion.div>
                )}

                <div
                  className={cn(
                    "relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-blue-50 text-blue-400 group-hover:bg-blue-100 group-hover:text-blue-600",
                  )}
                >
                  {i === 0 && <Zap className="h-6 w-6" />}
                  {i === 1 && <Sparkles className="h-6 w-6" />}
                  {i === 2 && <Crown className="h-6 w-6" />}
                  {i >= 3 && <Zap className="h-6 w-6" />}
                </div>

                <h3
                  className={cn(
                    "text-xl font-bold transition-colors",
                    isSelected ? "text-white" : "text-black",
                  )}
                >
                  {plan.name}
                </h3>

                <div className="mt-4">
                  {billingCycle === "YEARLY" ? (
                    <>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isSelected ? "text-white/60" : "text-gray-400",
                        )}
                      >
                        12x de
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn(
                            "text-4xl font-extrabold tracking-tight",
                            isSelected ? "text-white" : "text-black",
                          )}
                        >
                          {fmtBRL((pixPrice > 0 ? pixPrice : price) / 12)}
                        </span>
                        {pixPrice > 0 && pixPrice < price && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <QrCode className="h-2.5 w-2.5" /> PIX
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "invisible text-sm font-semibold",
                          isSelected ? "text-white/60" : "text-gray-400",
                        )}
                      >
                        1x de
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={cn(
                            "text-4xl font-extrabold tracking-tight",
                            isSelected ? "text-white" : "text-black",
                          )}
                        >
                          {fmtBRL(pixPrice > 0 ? pixPrice : price)}
                        </span>
                        {pixPrice > 0 && pixPrice < price && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <QrCode className="h-2.5 w-2.5" /> PIX
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {pixPrice > 0 && pixPrice < price && (
                  <div
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                      isSelected
                        ? "bg-white/15 text-white/70"
                        : "bg-blue-50 text-blue-500",
                    )}
                  >
                    <CreditCard className="h-3 w-3" />
                    {billingCycle === "YEARLY"
                      ? `12x de ${fmtBRL(price / 12)}`
                      : fmtBRL(price)}{" "}
                    no Cartão
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        disabled={!selectedPlan || loadingPlans}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
        Continuar para pagamento
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </motion.button>

      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50">
            <Shield className="h-3 w-3 text-primary" />
          </div>
          Pagamento seguro
        </span>
        <span className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          Ativação imediata
        </span>
        <span className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50">
            <Clock className="h-3 w-3 text-primary" />
          </div>
          Cancele quando quiser
        </span>
      </div>
    </motion.div>
  );
}
