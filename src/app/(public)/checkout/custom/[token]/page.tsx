"use client";

import { useSession } from "@/context/auth";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type CustomPlanStatus = "ACTIVE" | "EXPIRED" | "USED" | "CANCELED";
type BillingCycle = "MONTHLY" | "YEARLY";
type PaymentType = "PIX" | "CREDIT_CARD";

type ResolvedCustomPlan = {
  id: string;
  name: string | null;
  status: CustomPlanStatus;
  expiresAt: string;
  pixMonthlyPrice: number;
  pixYearlyPrice: number;
  creditMonthlyPrice: number;
  creditYearlyPrice: number;
  pixMonthlyEnabled: boolean;
  pixYearlyEnabled: boolean;
  creditMonthlyEnabled: boolean;
  creditYearlyEnabled: boolean;
  basePlan: { id: string; name: string; description: string; dailyRecordAvailable: number };
  user: { id: string; name: string; email: string };
  hasCustomerId: boolean;
};

type FlowState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      plan: ResolvedCustomPlan;
    }
  | {
      kind: "pix_awaiting";
      plan: ResolvedCustomPlan;
      pollingToken: string;
      qrCode: { encodedImage: string | null; payload: string | null };
      signatureId: string;
    }
  | { kind: "success"; plan: ResolvedCustomPlan };

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Expirado";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function maskCardNumber(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function maskExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function pickInitialOption(plan: ResolvedCustomPlan): {
  paymentType: PaymentType;
  billingCycle: BillingCycle;
} {
  if (plan.pixMonthlyEnabled) return { paymentType: "PIX", billingCycle: "MONTHLY" };
  if (plan.pixYearlyEnabled) return { paymentType: "PIX", billingCycle: "YEARLY" };
  if (plan.creditMonthlyEnabled) return { paymentType: "CREDIT_CARD", billingCycle: "MONTHLY" };
  return { paymentType: "CREDIT_CARD", billingCycle: "YEARLY" };
}

function methodOptionsAvailable(plan: ResolvedCustomPlan) {
  const hasPix = plan.pixMonthlyEnabled || plan.pixYearlyEnabled;
  const hasCard = plan.creditMonthlyEnabled || plan.creditYearlyEnabled;
  return { hasPix, hasCard };
}

function cycleOptionsAvailable(plan: ResolvedCustomPlan, paymentType: PaymentType) {
  if (paymentType === "PIX") {
    return { hasMonthly: plan.pixMonthlyEnabled, hasYearly: plan.pixYearlyEnabled };
  }
  return { hasMonthly: plan.creditMonthlyEnabled, hasYearly: plan.creditYearlyEnabled };
}

function priceFor(plan: ResolvedCustomPlan, paymentType: PaymentType, cycle: BillingCycle) {
  if (paymentType === "PIX") {
    return cycle === "YEARLY" ? plan.pixYearlyPrice : plan.pixMonthlyPrice;
  }
  return cycle === "YEARLY" ? plan.creditYearlyPrice : plan.creditMonthlyPrice;
}

export default function CustomCheckoutPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { handleGetProfile, handleGetAvailableRecording } = useSession();
  const rawToken = typeof params?.token === "string" ? params.token : "";
  const token = useMemo(() => {
    try {
      return decodeURIComponent(rawToken);
    } catch {
      return rawToken;
    }
  }, [rawToken]);

  const [flow, setFlow] = useState<FlowState>({ kind: "loading" });
  const [now, setNow] = useState(() => Date.now());

  const [paymentType, setPaymentType] = useState<PaymentType>("PIX");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");

  // Billing info (ex-user's CPF etc.)
  const [billing, setBilling] = useState({
    name: "",
    email: "",
    cpfCnpj: "",
    mobilePhone: "",
    postalCode: "",
    addressNumber: "",
  });

  // Credit card
  const [card, setCard] = useState({
    holderName: "",
    number: "",
    expiry: "", // MM/AA
    ccv: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Resolve token on mount
  useEffect(() => {
    if (!token) {
      setFlow({ kind: "error", message: "Link inválido." });
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setFlow({ kind: "error", message: "API URL não configurada." });
      return;
    }
    fetch(`${apiUrl}/custom-plan/by-token/resolve?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setFlow({
            kind: "error",
            message: data?.message || "Link indisponível.",
          });
          return;
        }
        const plan: ResolvedCustomPlan = data;
        const initial = pickInitialOption(plan);
        setPaymentType(initial.paymentType);
        setBillingCycle(initial.billingCycle);
        setBilling((b) => ({
          ...b,
          name: plan.user.name,
          email: plan.user.email,
        }));
        setCard((c) => ({ ...c, holderName: plan.user.name }));
        setFlow({ kind: "ready", plan });
      })
      .catch((err) => {
        console.error(err);
        setFlow({ kind: "error", message: "Erro ao carregar link." });
      });
  }, [token]);

  // Sync cycle when switching method if current cycle not enabled for new method
  useEffect(() => {
    if (flow.kind !== "ready") return;
    const { hasMonthly, hasYearly } = cycleOptionsAvailable(flow.plan, paymentType);
    if (billingCycle === "MONTHLY" && !hasMonthly && hasYearly) setBillingCycle("YEARLY");
    else if (billingCycle === "YEARLY" && !hasYearly && hasMonthly) setBillingCycle("MONTHLY");
  }, [paymentType, flow, billingCycle]);

  // Polling loop when pix_awaiting
  useEffect(() => {
    if (flow.kind !== "pix_awaiting") return;
    const { pollingToken } = flow;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/checkout/custom/poll?pollingToken=${encodeURIComponent(pollingToken)}`,
        );
        const data = await res.json();
        if (data?.status === "ACTIVE") {
          toast.success("Pagamento confirmado!");
          // Força refresh do profile + availability antes de navegar para que
          // o widget de plano / banner de trial atualize imediatamente.
          await Promise.all([handleGetProfile(true), handleGetAvailableRecording()]);
          setFlow({ kind: "success", plan: flow.plan });
          setTimeout(() => router.push("/"), 800);
        }
      } catch {
        // silent
      }
    };
    pollRef.current = setInterval(tick, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [flow, router, handleGetProfile, handleGetAvailableRecording]);

  const planForDisplay =
    flow.kind === "ready" || flow.kind === "pix_awaiting" || flow.kind === "success"
      ? flow.plan
      : null;

  const remainingMs = planForDisplay
    ? new Date(planForDisplay.expiresAt).getTime() - now
    : 0;
  const isExpired = remainingMs <= 0 && planForDisplay !== null;

  const needsBilling =
    flow.kind === "ready" && (!flow.plan.hasCustomerId || paymentType === "CREDIT_CARD");

  const showMethodSelector = planForDisplay
    ? (() => {
        const { hasPix, hasCard } = methodOptionsAvailable(planForDisplay);
        return hasPix && hasCard;
      })()
    : false;

  const showCycleSelector = planForDisplay
    ? (() => {
        const { hasMonthly, hasYearly } = cycleOptionsAvailable(planForDisplay, paymentType);
        return hasMonthly && hasYearly;
      })()
    : false;

  const currentPrice = planForDisplay
    ? priceFor(planForDisplay, paymentType, billingCycle)
    : 0;

  const canSubmit = !submitting && !isExpired && flow.kind === "ready";

  const validateBilling = () => {
    if (!needsBilling) return true;
    if (!billing.name || !billing.email || !billing.cpfCnpj || !billing.mobilePhone) {
      toast.error("Preencha nome, email, CPF/CNPJ e telefone.");
      return false;
    }
    return true;
  };

  const validateCard = () => {
    if (paymentType !== "CREDIT_CARD") return true;
    if (!card.holderName || !card.number || !card.expiry || !card.ccv) {
      toast.error("Preencha todos os dados do cartão.");
      return false;
    }
    const expParts = card.expiry.split("/");
    if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2) {
      toast.error("Validade inválida (MM/AA).");
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (flow.kind !== "ready") return;
    if (!validateBilling()) return;
    if (!validateCard()) return;

    setSubmitting(true);
    try {
      if (paymentType === "PIX") {
        const res = await fetch("/api/checkout/custom/consume-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            billingCycle,
            billingInfo: needsBilling
              ? {
                  name: billing.name,
                  email: billing.email,
                  cpfCnpj: billing.cpfCnpj.replace(/\D/g, ""),
                  mobilePhone: billing.mobilePhone.replace(/\D/g, ""),
                  postalCode: billing.postalCode || undefined,
                  addressNumber: billing.addressNumber || undefined,
                  address: billing.addressNumber || undefined,
                }
              : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.message || "Erro ao gerar PIX.");
          setSubmitting(false);
          return;
        }
        setFlow({
          kind: "pix_awaiting",
          plan: flow.plan,
          pollingToken: data.pollingToken,
          qrCode: data.qrCode,
          signatureId: data.signatureId,
        });
      } else {
        const expParts = card.expiry.split("/");
        const res = await fetch("/api/checkout/custom/consume-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            billingCycle,
            creditCard: {
              holderName: card.holderName,
              number: card.number.replace(/\s/g, ""),
              expiryMonth: expParts[0],
              expiryYear: expParts[1],
              ccv: card.ccv,
            },
            creditCardHolderInfo: {
              name: billing.name,
              email: billing.email,
              cpfCnpj: billing.cpfCnpj.replace(/\D/g, ""),
              postalCode: billing.postalCode.replace(/\D/g, ""),
              addressNumber: billing.addressNumber,
              phone: billing.mobilePhone.replace(/\D/g, ""),
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.message || "Erro ao processar cartão.");
          setSubmitting(false);
          return;
        }
        toast.success("Assinatura criada!");
        // Força refresh do profile + availability antes de navegar — sem isso,
        // o banner de trial / widget de plano continua mostrando dados stale.
        await Promise.all([handleGetProfile(true), handleGetAvailableRecording()]);
        setFlow({ kind: "success", plan: flow.plan });
        setTimeout(() => router.push("/"), 800);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar o pagamento.");
    } finally {
      setSubmitting(false);
    }
  }, [flow, paymentType, billingCycle, token, billing, card, needsBilling, router, handleGetProfile, handleGetAvailableRecording]);

  if (flow.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Carregando link...</p>
      </div>
    );
  }

  if (flow.kind === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-stone-900">Link indisponível</h1>
          <p className="mt-2 text-sm text-stone-600">{flow.message}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  if (flow.kind === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-emerald-700">Assinatura confirmada!</h1>
          <p className="mt-2 text-sm text-stone-600">
            Redirecionando para o painel...
          </p>
        </div>
      </div>
    );
  }

  const plan = flow.plan;

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">
            {plan.name || "Plano personalizado"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Baseado em <strong>{plan.basePlan.name}</strong>. Olá,{" "}
            <strong>{plan.user.name}</strong>.
          </p>
          <div
            className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
              isExpired
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Este link expira em</span>
              <span className="font-mono text-lg">
                {formatCountdown(remainingMs)}
              </span>
            </div>
          </div>
        </div>

        {flow.kind === "ready" && (
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
            {showMethodSelector && (
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700">
                  Método de pagamento
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("PIX")}
                    disabled={!methodOptionsAvailable(plan).hasPix}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      paymentType === "PIX"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("CREDIT_CARD")}
                    disabled={!methodOptionsAvailable(plan).hasCard}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      paymentType === "CREDIT_CARD"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    Cartão
                  </button>
                </div>
              </div>
            )}

            {showCycleSelector && (
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700">Ciclo</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    disabled={!cycleOptionsAvailable(plan, paymentType).hasMonthly}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      billingCycle === "MONTHLY"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("YEARLY")}
                    disabled={!cycleOptionsAvailable(plan, paymentType).hasYearly}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      billingCycle === "YEARLY"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    Anual
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                {paymentType === "PIX" ? "PIX" : "Cartão"}{" "}
                {billingCycle === "YEARLY" ? "Anual" : "Mensal"}
              </p>
              <p className="mt-1 text-3xl font-bold text-stone-900">
                {brl(currentPrice)}
              </p>
            </div>

            {needsBilling && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-stone-700">Dados de cobrança</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    placeholder="Nome completo"
                    value={billing.name}
                    onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="E-mail"
                    type="email"
                    value={billing.email}
                    onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="CPF/CNPJ (só números)"
                    value={billing.cpfCnpj}
                    onChange={(e) => setBilling({ ...billing, cpfCnpj: e.target.value })}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Telefone (só números com DDD)"
                    value={billing.mobilePhone}
                    onChange={(e) => setBilling({ ...billing, mobilePhone: e.target.value })}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  {paymentType === "CREDIT_CARD" && (
                    <>
                      <input
                        placeholder="CEP"
                        value={billing.postalCode}
                        onChange={(e) =>
                          setBilling({ ...billing, postalCode: e.target.value })
                        }
                        className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Número do endereço"
                        value={billing.addressNumber}
                        onChange={(e) =>
                          setBilling({ ...billing, addressNumber: e.target.value })
                        }
                        className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {paymentType === "CREDIT_CARD" && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-stone-700">Dados do cartão</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    placeholder="Nome impresso no cartão"
                    value={card.holderName}
                    onChange={(e) => setCard({ ...card, holderName: e.target.value })}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    placeholder="Número do cartão"
                    value={card.number}
                    onChange={(e) =>
                      setCard({ ...card, number: maskCardNumber(e.target.value) })
                    }
                    maxLength={23}
                    inputMode="numeric"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    placeholder="MM/AA"
                    value={card.expiry}
                    onChange={(e) =>
                      setCard({ ...card, expiry: maskExpiry(e.target.value) })
                    }
                    maxLength={5}
                    inputMode="numeric"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="CVV"
                    value={card.ccv}
                    onChange={(e) =>
                      setCard({ ...card, ccv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    maxLength={4}
                    inputMode="numeric"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="w-full rounded-xl bg-gradient-to-r from-stone-900 to-stone-950 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting
                ? "Processando..."
                : isExpired
                  ? "Link expirou"
                  : paymentType === "PIX"
                    ? `Pagar ${brl(currentPrice)} via PIX`
                    : `Finalizar ${brl(currentPrice)} no cartão`}
            </button>
          </div>
        )}

        {flow.kind === "pix_awaiting" && (
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4 text-center">
            <h2 className="text-xl font-semibold text-stone-900">
              Escaneie o QR ou copie o código
            </h2>
            {flow.qrCode.encodedImage ? (
              <img
                src={`data:image/png;base64,${flow.qrCode.encodedImage}`}
                alt="QR Code PIX"
                className="mx-auto h-64 w-64 rounded-lg border border-stone-200"
              />
            ) : (
              <p className="text-sm text-stone-500">
                QR indisponível. Use o código copia-e-cola abaixo.
              </p>
            )}
            {flow.qrCode.payload && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-left">
                <p className="text-xs font-medium text-stone-500 mb-1">
                  Código PIX copia-e-cola
                </p>
                <p className="break-all text-xs text-stone-900 font-mono">
                  {flow.qrCode.payload}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(flow.qrCode.payload!);
                    toast.success("Código copiado!");
                  }}
                  className="mt-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  Copiar
                </button>
              </div>
            )}
            <p className="text-xs text-stone-500">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
