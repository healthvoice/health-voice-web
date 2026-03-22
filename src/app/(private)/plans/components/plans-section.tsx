"use client";

import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  Crown,
  CreditCard,
  Loader2,
  MessageCircle,
  QrCode,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { BillingCycle, Plan } from "./types";
import { EASE, fmtBRL, getPlanCreditPrice, getPlanPixPrice } from "./utils";

// ─── Static plan metadata ─────────────────────────────────────────────────────

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanStaticData {
  subtitle: string;
  displayName?: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  features: PlanFeature[];
  highlight?: boolean;
  tag?: string;
  badge?: string;
}

const PLAN_STATIC_DATA: PlanStaticData[] = [
  {
    subtitle: "Ilimitado",
    displayName: "AUTÔNOMO",
    accentColor: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    features: [
      { text: "Gravação ilimitada", included: true, highlight: true },
      { text: "150 horas de transcrição mensal", included: true },
      { text: "5 horas de transcrição por dia", included: true },
      { text: "Prontuários automáticos básicos", included: true },
      { text: "Suporte comunitário", included: true },
      { text: "Diarização de falantes", included: false },
      { text: "Insights clínicos avançados", included: false },
      { text: "Suporte dedicado", included: false },
    ],
  },
  {
    subtitle: "Ilimitado",
    displayName: "ULTRA",
    accentColor: "text-cyan-600",
    accentBg: "bg-cyan-50",
    accentBorder: "border-cyan-200",
    highlight: true,
    tag: "Mais Popular",
    features: [
      { text: "Gravação 100% ilimitada", included: true, highlight: true },
      { text: "Transcrição 100% ilimitada", included: true, highlight: true },
      { text: "Prontuários automáticos", included: true },
      { text: "Insights clínicos avançados", included: true },
      { text: "Diarização de falantes", included: true },
      { text: "Personalizar ou treinar IA", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Exportação avançada", included: true },
    ],
  },
  {
    subtitle: "Corporativo",
    accentColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    badge: "Para clínicas",
    features: [
      { text: "Pool de Horas inteligente", included: true, highlight: true },
      { text: "Gravação ilimitada por usuário", included: true },
      { text: "5h transcrição/dia por usuário", included: true },
      { text: "Banco de horas compartilhado", included: true, highlight: true },
      { text: "Personalizar e treinar a IA", included: true },
      { text: "Gerente de conta dedicado", included: true },
      { text: "SLA e suporte 24/7", included: true },
    ],
  },
];

// ─── Comparison table data ────────────────────────────────────────────────────

const COMPARISON_ROWS: { feature: string; values: (string | boolean)[] }[] = [
  { feature: "Gravação",                values: ["Ilimitada", "100% ilimitada"] },
  { feature: "Transcrição",             values: ["150h/mês · 5h/dia", "Ilimitada"] },
  { feature: "Prontuários por IA",      values: ["Básico", "Completo"] },
  { feature: "Insights clínicos",       values: [false, true] },
  { feature: "Diarização de falantes",  values: [false, true] },
  { feature: "Personalizar ou treinar IA", values: [false, true] },
  { feature: "Pool de horas",           values: [false, false] },
  { feature: "Suporte",                 values: ["Comunitário", "Prioritário"] },
  { feature: "Exportação avançada",     values: [false, true] },
];

// ─── PlanSelectDot ────────────────────────────────────────────────────────────

function PlanSelectDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
        selected
          ? "border-white bg-white"
          : "border-gray-300 bg-transparent",
      )}
    >
      {selected && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
    </div>
  );
}

// ─── PlansSection ─────────────────────────────────────────────────────────────

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
  const displayPlans = plans.slice(0, 2);

  return (
  <>
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col items-center gap-10 py-10"
    >
      {/* Header */}
      <div className="w-full text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
          Escolha seu plano
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Selecione o plano ideal e desbloqueie todo o potencial do Health Voice.
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
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {displayPlans.map((plan, i) => {
            const isSelected = selectedPlan === plan.id;
            const price = getPlanCreditPrice(plan, billingCycle);
            const pixPrice = getPlanPixPrice(plan, billingCycle);
            const staticData = PLAN_STATIC_DATA[i] ?? PLAN_STATIC_DATA[0];
            const isHighlight = staticData.highlight ?? false;

            return (
              <motion.button
                key={plan.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPlanSelect(plan.id)}
                className={cn(
                  "group relative flex flex-col rounded-3xl p-7 text-left transition-all duration-300",
                  isSelected
                    ? "bg-gradient-to-br from-[#0d78ec] to-[#1e40af] shadow-2xl ring-2 shadow-blue-600/30 ring-[#0d78ec]"
                    : isHighlight
                      ? "bg-gradient-to-br from-cyan-50 to-sky-100/60 shadow-lg ring-2 ring-cyan-200 hover:shadow-xl"
                      : "bg-white shadow-lg ring-1 shadow-gray-200/50 ring-gray-100 hover:shadow-xl hover:ring-blue-200",
                )}
              >
                {/* Popular badge */}
                {staticData.tag && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-b-xl px-4 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg",
                        isSelected
                          ? "bg-white/30"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-400/40",
                      )}
                    >
                      <Crown className="h-3 w-3" /> {staticData.tag}
                    </span>
                  </div>
                )}

                {/* Top row: icon + select dot */}
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                      isSelected
                        ? "bg-white/20 text-white"
                        : staticData.accentBg + " " + staticData.accentColor,
                    )}
                  >
                    {i === 0 && <Zap className="h-6 w-6" />}
                    {i === 1 && <Sparkles className="h-6 w-6" />}
                    {i >= 2 && <Crown className="h-6 w-6" />}
                  </div>
                  <PlanSelectDot selected={isSelected} />
                </div>

                {/* Plan name + subtitle */}
                <h3
                  className={cn(
                    "text-xl font-bold transition-colors",
                    isSelected ? "text-white" : "text-black",
                  )}
                >
                  {staticData.displayName ?? plan.name}
                </h3>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-medium",
                    isSelected ? "text-white/70" : "text-gray-400",
                  )}
                >
                  {staticData.subtitle}
                </p>

                {/* Price */}
                <div className="mt-5">
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
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-white/60" : "text-gray-400",
                          )}
                        >
                          /mês
                        </span>
                        {pixPrice > 0 && pixPrice < price && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <QrCode className="h-2.5 w-2.5" /> PIX
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl font-extrabold tracking-tight",
                          isSelected ? "text-white" : "text-black",
                        )}
                      >
                        {fmtBRL(pixPrice > 0 ? pixPrice : price)}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-white/60" : "text-gray-400",
                        )}
                      >
                        /mês
                      </span>
                      {pixPrice > 0 && pixPrice < price && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <QrCode className="h-2.5 w-2.5" /> PIX
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Credit card chip */}
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

                {/* Divider */}
                <div
                  className={cn(
                    "my-5 h-px w-full",
                    isSelected ? "bg-white/15" : "bg-gray-100",
                  )}
                />

                {/* Features */}
                <ul className="space-y-2.5">
                  {staticData.features.map((feat) => (
                    <li
                      key={feat.text}
                      className={cn(
                        "flex items-start gap-2.5 text-sm",
                        !feat.included && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          feat.included
                            ? isSelected
                              ? "bg-white/20"
                              : staticData.accentBg
                            : isSelected
                              ? "bg-white/10"
                              : "bg-gray-100",
                        )}
                      >
                        {feat.included ? (
                          <Check
                            className={cn(
                              "h-2.5 w-2.5",
                              isSelected ? "text-white" : staticData.accentColor,
                            )}
                            strokeWidth={3}
                          />
                        ) : (
                          <X
                            className={cn(
                              "h-2.5 w-2.5",
                              isSelected ? "text-white/50" : "text-gray-400",
                            )}
                            strokeWidth={3}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          feat.highlight && feat.included
                            ? isSelected
                              ? "font-semibold text-white"
                              : "font-semibold " + staticData.accentColor
                            : isSelected
                              ? "text-white/80"
                              : "text-gray-600",
                        )}
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}

          {/* ─── Card Empresa (estático, full-width) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-full overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/60 shadow-lg"
          >
            <div className="relative p-7 sm:p-8">
              {/* Decorative blob */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                {/* Left: info */}
                <div className="flex-1">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-700">
                    <Users className="h-3 w-3" /> Para clínicas
                  </div>
                  <h3 className="mt-3 text-2xl font-extrabold text-gray-900">
                    Empresa
                  </h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    Sob consulta
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
                    Solução completa para clínicas e hospitais com Pool de Horas inteligente, banco compartilhado e suporte dedicado.
                  </p>

                  <a
                    href="https://wa.me/5511999999999?text=Olá, gostaria de saber mais sobre o plano Empresa do Health Voice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/40"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Falar com Especialista
                  </a>
                </div>

                {/* Right: features grid */}
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  {PLAN_STATIC_DATA[2].features.map((feat) => (
                    <div key={feat.text} className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          feat.highlight ? "bg-emerald-100" : "bg-emerald-50",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-2.5 w-2.5",
                            feat.highlight ? "text-emerald-600" : "text-emerald-500",
                          )}
                          strokeWidth={3}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          feat.highlight
                            ? "font-semibold text-emerald-700"
                            : "text-gray-600",
                        )}
                      >
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Pool de Horas ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-100/40 blur-2xl" />

          <div className="relative">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Como funciona o Pool de Horas?
                </h3>
                <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">
                  Exclusivo do plano Empresa
                </p>
              </div>
            </div>

            <p className="mb-6 max-w-xl text-sm leading-relaxed text-gray-600">
              No plano Empresa, cada colaborador recebe{" "}
              <strong className="text-gray-800">5 horas diárias</strong> de transcrição.
              Essas horas são somadas em um banco compartilhado da clínica, permitindo que
              a equipe utilize o saldo de forma inteligente e colaborativa.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { users: 5,  hours: 25,  label: "Clínica pequena" },
                { users: 10, hours: 50,  label: "Clínica média" },
                { users: 50, hours: 250, label: "Grande hospital" },
              ].map((example) => (
                <div
                  key={example.users}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">
                      {example.label}
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {example.users}
                  </p>
                  <p className="text-xs text-gray-500">usuários</p>
                  <div className="my-3 h-px bg-emerald-100" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700">
                      {example.hours}h/dia disponíveis
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Tabela comparativa (hidden no mobile) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="hidden w-full md:block"
      >
        <div className="mb-6 text-center">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">
            Visão Geral
          </span>
          <h3 className="mt-1 text-2xl font-extrabold text-gray-900">
            Comparação completa
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Clique em um plano para selecioná-lo e ver todos os detalhes.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 pl-6 pr-4 text-left text-sm font-semibold text-gray-500 w-1/3">
                  Recurso
                </th>
                {displayPlans.map((plan, i) => {
                  const sd = PLAN_STATIC_DATA[i] ?? PLAN_STATIC_DATA[0];
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <th key={plan.id} className="px-4 py-3 text-center w-1/3">
                      <button
                        type="button"
                        onClick={() => onPlanSelect(plan.id)}
                        className={cn(
                          "w-full rounded-xl px-4 py-3 transition-all duration-200 group",
                          isSelected
                            ? cn(sd.accentBg, "ring-2", sd.accentBorder.replace("border-", "ring-"), "shadow-sm")
                            : "hover:bg-gray-50",
                        )}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {isSelected && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide",
                                sd.accentBg,
                                sd.accentColor,
                                "border",
                                sd.accentBorder,
                              )}
                            >
                              <Check className="h-2.5 w-2.5" strokeWidth={3} /> Selecionado
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm font-bold transition-colors",
                              isSelected ? sd.accentColor : "text-gray-600 group-hover:text-gray-900",
                            )}
                          >
                            {sd.displayName ?? plan.name}
                          </span>
                          <span className={cn("text-xs", isSelected ? "text-gray-500" : "text-gray-400")}>
                            {sd.subtitle}
                          </span>
                        </div>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, ri) => (
                <tr
                  key={row.feature}
                  className={cn(
                    "border-b border-gray-50 last:border-0",
                    ri % 2 === 0 ? "bg-white" : "bg-gray-50/40",
                  )}
                >
                  <td className="py-3.5 pl-6 pr-4 text-sm font-medium text-gray-700">
                    {row.feature}
                  </td>
                  {displayPlans.map((plan, i) => {
                    const sd = PLAN_STATIC_DATA[i] ?? PLAN_STATIC_DATA[0];
                    const isSelected = selectedPlan === plan.id;
                    const val = row.values[i];
                    return (
                      <td
                        key={plan.id}
                        onClick={() => onPlanSelect(plan.id)}
                        className={cn(
                          "px-6 py-3.5 text-center transition-all duration-200 cursor-pointer",
                          isSelected ? cn(sd.accentBg + "/40") : "hover:bg-gray-50",
                        )}
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <span
                              className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                                isSelected
                                  ? cn(sd.accentBg, sd.accentBorder)
                                  : "border-gray-200 bg-gray-50",
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isSelected ? sd.accentColor : "text-gray-400",
                                )}
                                strokeWidth={3}
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                              <X className="h-3.5 w-3.5 text-gray-300" strokeWidth={3} />
                            </span>
                          )
                        ) : (
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isSelected ? sd.accentColor : "text-gray-500",
                            )}
                          >
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Spacer para o footer fixo */}
      <div className="h-28" />
    </motion.div>

    {/* ─── Footer fixo (portal) ─── */}
    {typeof document !== "undefined" &&
      createPortal(
        <AnimatePresence>
          <motion.div
            key="plans-floating-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-[9999] border-t border-blue-100 bg-white/95 px-6 py-4 shadow-[0_-4px_20px_rgba(13,120,236,0.08)] backdrop-blur-md sm:px-8 lg:left-[33.333%]"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-4">
              {/* Selos de confiança */}
              <div className="hidden flex-1 items-center gap-5 sm:flex">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Pagamento seguro
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Zap className="h-3.5 w-3.5 text-primary" /> Ativação imediata
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Cancele quando quiser
                </span>
              </div>

              {/* Botão CTA */}
              <button
                type="button"
                onClick={onContinue}
                disabled={!selectedPlan || loadingPlans}
                className={cn(
                  "flex shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold whitespace-nowrap shadow-lg transition-all sm:ml-auto",
                  selectedPlan && !loadingPlans
                    ? "bg-primary text-white shadow-blue-600/25 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/30"
                    : "cursor-not-allowed bg-gray-100 text-gray-400 shadow-none",
                )}
              >
                {loadingPlans ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {selectedPlan ? "Continuar para pagamento" : "Selecione um plano"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
  </>
  );
}
