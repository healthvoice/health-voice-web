"use client";

import { useApiContext } from "@/context/ApiContext";
import { useSession } from "@/context/auth";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Loader2,
  MapPin,
  MessageCircle,
  PartyPopper,
  QrCode,
  Rocket,
  Shield,
  Sparkles,
  Ticket,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  description: string;
  pixMonthlyPrice?: number;
  pixYearlyPrice?: number;
  pixPrice?: number;
  creditMonthlyPrice?: number;
  creditYearlyPrice?: number;
  creditPrice?: number;
  dailyRecordAvailable?: number;
  monthlyRecordAvailable?: number;
  channels?: string[];
}

type BillingCycle = "MONTHLY" | "YEARLY";
type PaymentMethod = "card" | "pix";
type ViewState = "plans" | "checkout" | "success";

// ─── Utilities ────────────────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

const EASE = [0.32, 0.72, 0, 1] as const;

function getPlanPixPrice(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "YEARLY")
    return plan.pixYearlyPrice ?? (plan.pixPrice ?? 0) * 12;
  return plan.pixMonthlyPrice ?? plan.pixPrice ?? 0;
}

function getPlanCreditPrice(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "YEARLY")
    return plan.creditYearlyPrice ?? (plan.creditMonthlyPrice ?? 0) * 12;
  return plan.creditMonthlyPrice ?? plan.creditPrice ?? 0;
}

function getRecordLabel(plan: Plan): string {
  if (plan.monthlyRecordAvailable != null)
    return `${plan.monthlyRecordAvailable} horas/mês`;
  if (plan.dailyRecordAvailable != null) {
    const hoursPerMonth = Math.round((plan.dailyRecordAvailable * 30) / 3600);
    return `${hoursPerMonth} horas/mês`;
  }
  return "Gravação incluída";
}

function maskCpfCnpj(value: string): string {
  const v = onlyDigits(value);
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .substring(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskCep(value: string): string {
  const v = onlyDigits(value).slice(0, 8);
  return v.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhoneBR(v: string): string {
  let d = onlyDigits(v).slice(0, 13);
  let prefix = "";
  if (d.startsWith("55")) {
    prefix = "+55 ";
    d = d.slice(2);
  }
  if (d.length <= 2) return prefix + d;
  if (d.length <= 6) return `${prefix}(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `${prefix}(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${prefix}(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function maskCardNumber(v: string): string {
  return onlyDigits(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function maskExpiry(v: string): string {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function parseExpiry(value: string): { month: string; year: string } | null {
  const m = value.match(/^(\d{2})[\/\-]?(\d{2}|\d{4})$/);
  if (!m) return null;
  const month = m[1];
  let year = m[2];
  if (Number(month) < 1 || Number(month) > 12) return null;
  if (year.length === 2) year = `20${year}`;
  return { month, year };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  maxLength,
  disabled = false,
  rightElement,
  className,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  disabled?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-semibold text-gray-500">{label}</label>
      )}
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border bg-gray-50 px-3.5 transition-all",
          focused
            ? "border-blue-400 bg-white ring-2 ring-blue-50"
            : "border-gray-200",
          disabled && "opacity-50",
        )}
      >
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          maxLength={maxLength}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-300 outline-none"
        />
        {rightElement}
      </div>
    </div>
  );
}

function PaymentMethodTabs({
  selected,
  onChange,
}: {
  selected: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 rounded-xl bg-blue-50 p-1">
      {(["pix", "card"] as PaymentMethod[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
            selected === m
              ? "bg-primary text-white shadow-sm shadow-blue-500/30"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          {m === "pix" ? (
            <QrCode className="h-4 w-4" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {m === "pix" ? "PIX" : "Cartão"}
        </button>
      ))}
    </div>
  );
}

function CardPreview({
  holder,
  cardNumber,
  exp,
}: {
  holder: string;
  cardNumber: string;
  exp: string;
}) {
  return (
    <div
      className="relative mb-6 w-full overflow-hidden rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #0d78ec 0%, #1e40af 100%)",
        minHeight: 160,
        boxShadow: "0 10px 40px rgba(13,120,236,0.35)",
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <Image
          src="/logos/iconWhite.png"
          alt="Health Voice"
          width={70}
          height={26}
          className="h-6 w-auto object-contain opacity-80"
          onError={() => {}}
        />
        <CreditCard className="h-5 w-5 text-white/40" />
      </div>
      <p className="mb-4 font-mono text-lg tracking-widest text-white">
        {cardNumber ? maskCardNumber(cardNumber) : "**** **** **** ****"}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-0.5 text-[9px] font-semibold text-white/50 uppercase">
            Titular
          </p>
          <p className="text-xs font-medium text-white capitalize">
            {holder || "Seu Nome"}
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-right text-[9px] font-semibold text-white/50 uppercase">
            Validade
          </p>
          <p className="text-xs font-medium text-white">{exp || "MM/AA"}</p>
        </div>
      </div>
    </div>
  );
}

function FreePlanBanner() {
  return (
    <div
      className="mb-6 flex w-full flex-col items-center justify-center rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        minHeight: 120,
        boxShadow: "0 10px 40px rgba(16,185,129,0.3)",
      }}
    >
      <div className="mb-2 rounded-full bg-white/20 p-2.5">
        <Ticket className="h-7 w-7 text-white" />
      </div>
      <p className="text-xl font-bold text-white">100% OFF</p>
      <p className="mt-0.5 text-xs text-emerald-100">
        Assinatura Gratuita Garantida
      </p>
    </div>
  );
}

function PixGeneratedView({
  price,
  pixCode,
  pixEncodedImage,
  copied,
  onCopy,
  onAlreadyPaid,
}: {
  price: string;
  pixCode: string;
  pixEncodedImage: string | null;
  copied: boolean;
  onCopy: () => void;
  onAlreadyPaid: () => void;
}) {
  const qrUri = pixEncodedImage
    ? pixEncodedImage.startsWith("data:")
      ? pixEncodedImage
      : `data:image/png;base64,${pixEncodedImage}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold text-black">PIX gerado!</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Escaneie o QR Code ou copie o código para pagar
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* QR Code */}
        <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-gray-200 bg-white p-4">
          {qrUri ? (
            <img
              src={qrUri}
              alt="QR Code PIX"
              className="h-full w-full object-contain"
            />
          ) : (
            <QrCode className="h-36 w-36 text-gray-800" strokeWidth={1.2} />
          )}
        </div>

        {/* Price */}
        <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-6 py-3 text-center">
          <p className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Valor
          </p>
          <p className="text-2xl font-bold text-black">{price}</p>
        </div>

        {/* PIX Code */}
        <div className="w-full">
          <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Código PIX Copia e Cola
          </p>
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed break-all text-gray-500 select-all">
            {pixCode || "—"}
          </div>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={onCopy}
          disabled={!pixCode}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold transition-all",
            copied
              ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
              : "bg-primary text-white shadow-lg shadow-blue-600/25 hover:bg-blue-600",
            !pixCode && "cursor-not-allowed opacity-50",
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} /> Código Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar Código PIX
            </>
          )}
        </button>

        {/* Already paid */}
        <button
          type="button"
          onClick={onAlreadyPaid}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
        >
          Já realizei o pagamento
        </button>
      </div>

      {/* Polling indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Aguardando confirmação do pagamento...
      </div>
    </motion.div>
  );
}

function SuccessView({
  onGoHome,
}: {
  onGoHome: () => void;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex h-24 w-24 items-center justify-center rounded-full border border-black/10 bg-gray-50 shadow-inner"
      >
        <PartyPopper className="h-11 w-11 text-black" strokeWidth={1.5} />
      </motion.div>

      <div className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-4xl font-extrabold tracking-tight text-black"
        >
          Parabéns!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl font-semibold text-gray-700"
        >
          Sua assinatura foi confirmada
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mx-auto max-w-sm text-sm leading-relaxed text-gray-400"
        >
          Obrigado por confiar no Health Voice. Agora você tem acesso completo
          às ferramentas de transcrição e IA para elevar o nível do seu
          atendimento.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <button
          onClick={onGoHome}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-600"
        >
          Ir para o painel{" "}
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { GetAPI, PostAPI, PutAPI } = useApiContext();
  const { profile, setProfile, isTrial, handleGetAvailableRecording } =
    useSession();
  const router = useRouter();

  // ── View / navigation state
  const [viewState, setViewState] = useState<ViewState>("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // ── Payment method (PIX como padrão)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");

  // ── PIX state
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPayload, setPixPayload] = useState<string>("");
  const [pixEncodedImage, setPixEncodedImage] = useState<string | null>(null);
  const [pixSignatureId, setPixSignatureId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Form fields
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [house, setHouse] = useState("");
  const [holder, setHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [exp, setExp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");

  // ── Loading / coupon state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Fetch plans
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await GetAPI("/signature-plan/channel/WEB", true);
      if (res.status === 200 && res.body?.plans) {
        const list = res.body.plans as Plan[];
        setPlans(list);
        if (list.length > 0)
          setSelectedPlan(list[Math.min(1, list.length - 1)].id);
      }
    } catch {
      console.error("Erro ao buscar planos");
    } finally {
      setLoadingPlans(false);
    }
  }, [GetAPI]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Pre-fill form from profile
  useEffect(() => {
    if (profile) {
      if (!cpf) setCpf(profile.cpfCnpj ?? "");
      if (!cep) setCep(profile.postalCode ?? "");
      if (!address) setAddress(profile.address ?? "");
      if (!house) setHouse(profile.addressNumber ?? "");
      if (!holder) setHolder(profile.name ?? "");
      if (!email) setEmail(profile.email ?? "");
      if (!phone) setPhone(profile.mobilePhone ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // ── CEP auto-fill
  useEffect(() => {
    const cleaned = onlyDigits(cep);
    if (cleaned.length === 8) {
      fetch(`https://brasilapi.com.br/api/cep/v2/${cleaned}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.cep) {
            setAddress(
              [data.street, data.neighborhood, data.city]
                .filter(Boolean)
                .join(", ") + (data.state ? ` - ${data.state}` : ""),
            );
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // ── PIX polling
  useEffect(() => {
    if (!pixGenerated || !pixSignatureId || isFree) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkStatus = async () => {
      try {
        const res = await GetAPI(`/signature/${pixSignatureId}/status`, true);
        if (!mounted) return;
        if ([200, 201].includes(res.status) && res.body?.isPaid) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          await handleGetAvailableRecording();
          setViewState("success");
          return;
        }
      } catch {
        /* continua tentando */
      }
    };

    checkStatus();
    pollingIntervalRef.current = setInterval(checkStatus, 5000);

    timeoutId = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 900000);

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixGenerated, pixSignatureId]);

  // ── Computed
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  const basePrice = selectedPlanData
    ? paymentMethod === "card"
      ? getPlanCreditPrice(selectedPlanData, billingCycle)
      : getPlanPixPrice(selectedPlanData, billingCycle)
    : 0;

  const discountedPrice = basePrice * (1 - discountPercent / 100);
  const isFree = discountPercent === 100;
  const finalPrice = isFree
    ? 0
    : discountPercent > 0
      ? discountedPrice
      : basePrice;

  const canSubmit = useMemo(() => {
    if (!selectedPlan) return false;
    const cpfOk = onlyDigits(cpf).length >= 11;
    const holderOk = holder.trim().length >= 3;
    const emailOk = email.trim().length > 3 && email.includes("@");
    const phoneOk = onlyDigits(phone).length >= 10;
    const cepOk = onlyDigits(cep).length >= 8;
    const addressOk = address.trim().length > 0;
    const houseOk = house.trim().length > 0;
    const addressSectionOk = cepOk && addressOk && houseOk;

    if (isFree) return cpfOk && holderOk && emailOk && phoneOk;
    if (paymentMethod === "pix")
      return cpfOk && holderOk && emailOk && phoneOk && addressSectionOk;

    const cardOk = onlyDigits(cardNumber).length >= 12;
    const cvvOk = onlyDigits(cvv).length >= 3;
    const expOk = !!parseExpiry(exp);
    return (
      cpfOk &&
      holderOk &&
      emailOk &&
      phoneOk &&
      addressSectionOk &&
      cardOk &&
      cvvOk &&
      expOk
    );
  }, [
    cpf,
    holder,
    email,
    phone,
    cep,
    address,
    house,
    cardNumber,
    cvv,
    exp,
    isFree,
    selectedPlan,
    paymentMethod,
  ]);

  // ── Helpers
  async function updateProfileFromForm(): Promise<boolean> {
    const payload: Record<string, string> = {
      name: holder,
      email: email.trim(),
      cpfCnpj: onlyDigits(cpf),
      mobilePhone: onlyDigits(phone),
    };
    if (!isFree) {
      payload.postalCode = onlyDigits(cep);
      payload.address = address.trim();
      payload.addressNumber = house.trim();
    }
    const result = await PutAPI("/user", payload, true);
    if (result.status === 200 && profile) {
      setProfile({
        ...profile,
        name: payload.name,
        email: payload.email,
        cpfCnpj: payload.cpfCnpj ?? null,
        mobilePhone: payload.mobilePhone ?? null,
        postalCode: payload.postalCode ?? null,
        address: payload.address ?? null,
        addressNumber: payload.addressNumber ?? null,
      });
      return true;
    }
    return false;
  }

  async function handleCard() {
    if (!selectedPlan) throw new Error("Plano não selecionado.");
    const finalCoupon = coupon.trim();

    if (isFree) {
      const body: Record<string, unknown> = { billingCycle };
      if (finalCoupon) body.code = finalCoupon;
      const resp = await PostAPI(`/signature/pix/${selectedPlan}`, body, true);
      if ([200, 201].includes(resp.status)) {
        await handleGetAvailableRecording();
        setViewState("success");
      }
      return resp;
    }

    const expParsed = parseExpiry(exp);
    if (!expParsed) throw new Error("Data de expiração inválida.");

    const body = {
      planId: selectedPlan,
      billingCycle,
      code: finalCoupon || undefined,
      creditCard: {
        holderName: holder.toUpperCase(),
        number: onlyDigits(cardNumber),
        expiryMonth: expParsed.month,
        expiryYear: expParsed.year,
        ccv: onlyDigits(cvv),
      },
      creditCardHolderInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        postalCode: onlyDigits(cep),
        addressNumber: house.trim(),
        phone: onlyDigits(phone),
      },
      billingInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        mobilePhone: onlyDigits(phone),
        postalCode: onlyDigits(cep),
        address: address.trim(),
        addressNumber: house.trim(),
      },
    };

    const resp = await PostAPI("/signature/credit/new", body, true);
    if ([200, 201].includes(resp.status)) {
      await handleGetAvailableRecording();
      setViewState("success");
    }
    return resp;
  }

  async function handleGeneratePix(): Promise<{ status: number; body?: any }> {
    if (!selectedPlan) return { status: 400 };
    const finalCoupon = coupon.trim();
    const body = {
      billingCycle,
      code: finalCoupon || undefined,
      billingInfo: {
        name: holder,
        email: email.trim(),
        cpfCnpj: onlyDigits(cpf),
        mobilePhone: onlyDigits(phone),
        postalCode: onlyDigits(cep),
        address: address.trim(),
        addressNumber: house.trim(),
      },
    };
    const resp = await PostAPI(`/signature/pix/${selectedPlan}`, body, true);
    if ([200, 201].includes(resp.status) && resp.body?.payment) {
      setPixPayload(resp.body.payment.payload || "");
      setPixEncodedImage(resp.body.payment.encodedImage || null);
      setPixSignatureId(resp.body.signatureId || null);
      setPixGenerated(true);
    }
    return resp;
  }

  async function onSubmit() {
    if (!canSubmit) {
      toast.error(
        paymentMethod === "pix" || isFree
          ? "Verifique seus dados pessoais."
          : "Verifique os dados do cartão e endereço.",
      );
      return;
    }

    setSubmitLoading(true);
    try {
      await updateProfileFromForm();

      if (paymentMethod === "pix" && !isFree) {
        const resp = await handleGeneratePix();
        if (![200, 201].includes(resp.status)) {
          const msg =
            resp.body?.message ||
            resp.body?.errors?.[0]?.description ||
            "Não foi possível gerar o PIX. Tente novamente.";
          toast.error(msg);
        }
        return;
      }

      const resp = await handleCard();
      if (resp && ![200, 201].includes(resp.status)) {
        const msg =
          resp.body?.message ||
          resp.body?.errors?.[0]?.description ||
          "Não foi possível processar o pagamento.";
        toast.error(msg);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleCopyPixCode() {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function handleCheckCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCoupon(true);
    try {
      const resp = await GetAPI(`/coupon/${code}`, false);
      if (resp.status === 200 && resp.body?.discount !== undefined) {
        const discount = Number(resp.body.discount);
        setDiscountPercent(discount);
        toast.success(
          discount === 100
            ? "100% de desconto concedido!"
            : `${discount}% de desconto concedido!`,
        );
      } else {
        setDiscountPercent(0);
        toast.error(
          String(resp.body?.message || resp.body || "Cupom não encontrado."),
        );
      }
    } catch {
      setDiscountPercent(0);
      toast.error("Erro ao validar cupom. Tente novamente.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleChangePaymentMethod(m: PaymentMethod) {
    setPaymentMethod(m);
    setPixGenerated(false);
    setPixCopied(false);
    setPixPayload("");
    setPixEncodedImage(null);
    setPixSignatureId(null);
  }

  function handleBack() {
    if (viewState === "success") return;
    if (pixGenerated) {
      setPixGenerated(false);
    } else if (viewState === "checkout") {
      setViewState("plans");
    } else {
      router.push("/");
    }
  }

  const isCheckout = viewState === "checkout";
  const isSuccess = viewState === "success";

  // ── Price label helpers
  const priceLabel = () => {
    if (isFree) return "";
    if (paymentMethod === "card" && billingCycle === "YEARLY")
      return "Cobrança em 12x (anual)";
    if (paymentMethod === "card") return "Cobrança mensal";
    return billingCycle === "YEARLY"
      ? "Valor total anual via PIX"
      : "Pagamento via PIX";
  };

  const submitLabel = () => {
    if (submitLoading) return "Processando...";
    if (isFree) return "Confirmar Inscrição Gratuita";
    if (paymentMethod === "pix") return "Gerar PIX";
    return "Finalizar Pagamento";
  };

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
              onClick={handleBack}
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
              {selectedPlanData && (
                <>
                  {isCheckout ? (
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
                          alt={selectedPlanData.name}
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
                            {selectedPlanData.name}
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
                                      ? getPlanPixPrice(selectedPlanData, billingCycle)
                                      : getPlanCreditPrice(selectedPlanData, billingCycle),
                                )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={selectedPlanData.id + billingCycle + paymentMethod}
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
                            {selectedPlanData.name}
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
                                    ? getPlanPixPrice(selectedPlanData, billingCycle)
                                    : getPlanCreditPrice(selectedPlanData, billingCycle)) / 12,
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
                                        ? getPlanPixPrice(selectedPlanData, billingCycle)
                                        : getPlanCreditPrice(selectedPlanData, billingCycle)) *
                                        (1 - discountPercent / 100),
                                    )
                                  : fmtBRL(
                                      paymentMethod === "pix"
                                        ? getPlanPixPrice(selectedPlanData, billingCycle)
                                        : getPlanCreditPrice(selectedPlanData, billingCycle),
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
                            {getRecordLabel(selectedPlanData)}
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
                </>
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
              onClick={handleBack}
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
                isCheckout &&
                  !(pixGenerated && paymentMethod === "pix") &&
                  "pb-40",
                !isCheckout && "min-h-screen",
              )}
            >
              <AnimatePresence mode="wait">
                {/* ═══ PLANS ═══ */}
                {viewState === "plans" && (
                  <motion.div
                    key="plans"
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
                        Selecione o plano ideal e desbloqueie todo o potencial
                        do Health Voice.
                      </p>
                    </div>

                    {/* Billing toggle */}
                    <div className="inline-flex rounded-full bg-white p-1.5 shadow-sm ring-1 ring-blue-100">
                      <button
                        onClick={() => setBillingCycle("MONTHLY")}
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
                        onClick={() => setBillingCycle("YEARLY")}
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
                              onClick={() => setSelectedPlan(plan.id)}
                              className={cn(
                                "group relative flex flex-col items-center rounded-3xl p-8 text-center transition-all duration-300",
                                isSelected
                                  ? "bg-gradient-to-br from-[#0d78ec] to-[#1e40af] shadow-2xl ring-2 shadow-blue-600/30 ring-[#0d78ec]"
                                  : "bg-white shadow-lg ring-1 shadow-gray-200/50 ring-gray-100 hover:shadow-xl hover:ring-blue-200",
                                isPopular &&
                                  !isSelected &&
                                  "ring-2 ring-[#0d78ec]/30",
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
                                        isSelected
                                          ? "text-white/60"
                                          : "text-gray-400",
                                      )}
                                    >
                                      12x de
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span
                                        className={cn(
                                          "text-4xl font-extrabold tracking-tight",
                                          isSelected
                                            ? "text-white"
                                            : "text-black",
                                        )}
                                      >
                                        {fmtBRL(
                                          (pixPrice > 0 ? pixPrice : price) /
                                            12,
                                        )}
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
                                        isSelected
                                          ? "text-white/60"
                                          : "text-gray-400",
                                      )}
                                    >
                                      1x de
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span
                                        className={cn(
                                          "text-4xl font-extrabold tracking-tight",
                                          isSelected
                                            ? "text-white"
                                            : "text-black",
                                        )}
                                      >
                                        {fmtBRL(
                                          pixPrice > 0 ? pixPrice : price,
                                        )}
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
                      onClick={() => selectedPlan && setViewState("checkout")}
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
                )}

                {/* ═══ CHECKOUT ═══ */}
                {viewState === "checkout" && selectedPlanData && (
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, x: 40, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="flex flex-col justify-start space-y-0 pt-4"
                  >
                    {/* Header */}
                    <div className="mb-5">
                      <div className="flex flex-row justify-between gap-2">
                        <h2 className="text-2xl font-bold text-black">
                          Finalizar assinatura
                        </h2>
                        {isCheckout && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-semibold tracking-wider text-primary uppercase shadow-sm sm:flex"
                          >
                            <Shield className="h-3 w-3" /> Checkout seguro
                          </motion.div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-gray-500">
                        Plano{" "}
                        <span className="font-semibold text-gray-700">
                          {selectedPlanData.name}
                        </span>{" "}
                        — {billingCycle === "YEARLY" ? "Anual" : "Mensal"}
                      </p>
                    </div>

                    {/* Payment method tabs */}
                    {!isFree && (
                      <PaymentMethodTabs
                        selected={paymentMethod}
                        onChange={handleChangePaymentMethod}
                      />
                    )}

                    {/* PIX Generated view */}
                    {pixGenerated && paymentMethod === "pix" ? (
                      <PixGeneratedView
                        price={fmtBRL(finalPrice)}
                        pixCode={pixPayload}
                        pixEncodedImage={pixEncodedImage}
                        copied={pixCopied}
                        onCopy={handleCopyPixCode}
                        onAlreadyPaid={() => setViewState("success")}
                      />
                    ) : (
                      <>
                        {/* Card preview */}
                        {paymentMethod === "card" && !isFree && (
                          <CardPreview
                            holder={holder}
                            cardNumber={cardNumber}
                            exp={exp}
                          />
                        )}

                        {/* Free plan banner */}
                        {isFree && <FreePlanBanner />}

                        {/* Personal info */}
                        <SectionCard
                          title="Informações Pessoais"
                          icon={<User className="h-4 w-4" />}
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field
                              label="CPF / CNPJ"
                              placeholder="000.000.000-00"
                              value={maskCpfCnpj(cpf)}
                              onChange={(t) => setCpf(onlyDigits(t))}
                              maxLength={18}
                            />
                            <Field
                              label="Nome Completo"
                              placeholder="Nome do titular"
                              value={holder}
                              onChange={setHolder}
                            />
                            <Field
                              label="E-mail"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={setEmail}
                              type="email"
                            />
                            <Field
                              label="Telefone"
                              placeholder="(00) 00000-0000"
                              value={maskPhoneBR(phone)}
                              onChange={(t) => setPhone(onlyDigits(t))}
                              maxLength={16}
                            />
                          </div>
                        </SectionCard>

                        {/* Billing address */}
                        {!isFree && (
                          <SectionCard
                            title="Endereço de Cobrança"
                            icon={<MapPin className="h-4 w-4" />}
                          >
                            <div className="mb-3 grid grid-cols-3 gap-3">
                              <Field
                                label="CEP"
                                placeholder="00000-000"
                                value={maskCep(cep)}
                                onChange={(t) => setCep(onlyDigits(t))}
                                maxLength={9}
                                className="col-span-2"
                              />
                              <Field
                                label="Número"
                                placeholder="123"
                                value={house}
                                onChange={setHouse}
                              />
                            </div>
                            <Field
                              label="Endereço"
                              placeholder="Rua, bairro, cidade"
                              value={address}
                              onChange={setAddress}
                            />
                          </SectionCard>
                        )}

                        {/* Card data */}
                        {paymentMethod === "card" && !isFree && (
                          <SectionCard
                            title="Dados do Cartão"
                            icon={<CreditCard className="h-4 w-4" />}
                          >
                            <div className="flex flex-col gap-3">
                              <Field
                                label="Número do Cartão"
                                placeholder="0000 0000 0000 0000"
                                value={maskCardNumber(cardNumber)}
                                onChange={setCardNumber}
                                maxLength={19}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Field
                                  label="Validade"
                                  placeholder="MM/AA"
                                  value={maskExpiry(exp)}
                                  onChange={setExp}
                                  maxLength={5}
                                />
                                <Field
                                  label="CVV"
                                  placeholder="123"
                                  value={onlyDigits(cvv).slice(0, 4)}
                                  onChange={setCvv}
                                  type="tel"
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* Coupon */}
                        <SectionCard
                          title="Cupom de Desconto"
                          icon={<Ticket className="h-4 w-4" />}
                        >
                          <Field
                            placeholder="CÓDIGO DO CUPOM"
                            value={coupon}
                            onChange={(t) =>
                              !discountPercent && setCoupon(t.toUpperCase())
                            }
                            disabled={!!discountPercent}
                            rightElement={
                              <button
                                type="button"
                                onClick={handleCheckCoupon}
                                disabled={
                                  isValidatingCoupon ||
                                  !!discountPercent ||
                                  !coupon.trim()
                                }
                                className={cn(
                                  "ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase transition-all",
                                  discountPercent
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                  (isValidatingCoupon ||
                                    !!discountPercent ||
                                    !coupon.trim()) &&
                                    "cursor-not-allowed opacity-60",
                                )}
                              >
                                {isValidatingCoupon ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : discountPercent ? (
                                  <>
                                    <Check className="h-3 w-3" /> Aplicado
                                  </>
                                ) : (
                                  "Aplicar"
                                )}
                              </button>
                            }
                          />
                          {discountPercent > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
                            >
                              <Ticket className="h-4 w-4 shrink-0 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-700">
                                {isFree
                                  ? "100% de desconto — Assinatura Gratuita!"
                                  : `${discountPercent}% de desconto aplicado`}
                              </span>
                            </motion.div>
                          )}
                        </SectionCard>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ═══ SUCCESS ═══ */}
                {viewState === "success" && (
                  <SuccessView onGoHome={() => router.push("/")} />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ═══ Footer fixo (checkout) — portal ═══ */}
          {typeof document !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {isCheckout && !(pixGenerated && paymentMethod === "pix") && (
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
                        {priceLabel() && (
                          <p className="mb-0.5 truncate text-[11px] text-gray-400">
                            {priceLabel()}
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
                            {billingCycle === "YEARLY" &&
                            paymentMethod === "card"
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
                            <Loader2 className="h-4 w-4 animate-spin" />{" "}
                            Processando...
                          </>
                        ) : (
                          <>
                            {submitLabel()}{" "}
                            {!isFree && <ArrowRight className="h-4 w-4" />}
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
            )}

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
    </div>
  );
}
