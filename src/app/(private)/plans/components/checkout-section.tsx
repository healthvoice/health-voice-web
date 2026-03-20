"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Shield,
  Ticket,
  User,
} from "lucide-react";
import type { BillingCycle, PaymentMethod, Plan } from "./types";
import {
  CardPreview,
  Field,
  FreePlanBanner,
  PaymentMethodTabs,
  PixGeneratedView,
  SectionCard,
} from "./sub-components";
import { EASE, fmtBRL, maskCardNumber, maskCep, maskCpfCnpj, maskExpiry, maskPhoneBR, onlyDigits } from "./utils";

interface CheckoutSectionProps {
  selectedPlan: Plan;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  isFree: boolean;
  discountPercent: number;
  finalPrice: number;
  // Form fields
  cpf: string;
  holder: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  house: string;
  cardNumber: string;
  cvv: string;
  exp: string;
  coupon: string;
  // State
  pixGenerated: boolean;
  pixCopied: boolean;
  pixPayload: string;
  pixEncodedImage: string | null;
  isValidatingCoupon: boolean;
  // Handlers
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCpfChange: (value: string) => void;
  onHolderChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCepChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onHouseChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onExpChange: (value: string) => void;
  onCouponChange: (value: string) => void;
  onCheckCoupon: () => void;
  onCopyPixCode: () => void;
  onAlreadyPaid: () => void;
}

export function CheckoutSection({
  selectedPlan,
  billingCycle,
  paymentMethod,
  isFree,
  discountPercent,
  finalPrice,
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
  coupon,
  pixGenerated,
  pixCopied,
  pixPayload,
  pixEncodedImage,
  isValidatingCoupon,
  onPaymentMethodChange,
  onCpfChange,
  onHolderChange,
  onEmailChange,
  onPhoneChange,
  onCepChange,
  onAddressChange,
  onHouseChange,
  onCardNumberChange,
  onCvvChange,
  onExpChange,
  onCouponChange,
  onCheckCoupon,
  onCopyPixCode,
  onAlreadyPaid,
}: CheckoutSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex flex-col justify-start space-y-0 pt-4"
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-row justify-between gap-2">
          <h2 className="text-2xl font-bold text-black">Finalizar assinatura</h2>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-semibold tracking-wider text-primary uppercase shadow-sm sm:flex"
          >
            <Shield className="h-3 w-3" /> Checkout seguro
          </motion.div>
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          Plano <span className="font-semibold text-gray-700">{selectedPlan.name}</span>{" "}
          — {billingCycle === "YEARLY" ? "Anual" : "Mensal"}
        </p>
      </div>

      {/* Payment method tabs */}
      {!isFree && (
        <PaymentMethodTabs selected={paymentMethod} onChange={onPaymentMethodChange} />
      )}

      {/* PIX Generated view */}
      {pixGenerated && paymentMethod === "pix" ? (
        <PixGeneratedView
          price={fmtBRL(finalPrice)}
          pixCode={pixPayload}
          pixEncodedImage={pixEncodedImage}
          copied={pixCopied}
          onCopy={onCopyPixCode}
          onAlreadyPaid={onAlreadyPaid}
        />
      ) : (
        <>
          {/* Card preview */}
          {paymentMethod === "card" && !isFree && (
            <CardPreview holder={holder} cardNumber={cardNumber} exp={exp} />
          )}

          {/* Free plan banner */}
          {isFree && <FreePlanBanner />}

          {/* Personal info */}
          <SectionCard title="Informações Pessoais" icon={<User className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="CPF / CNPJ"
                placeholder="000.000.000-00"
                value={maskCpfCnpj(cpf)}
                onChange={(t) => onCpfChange(onlyDigits(t))}
                maxLength={18}
              />
              <Field
                label="Nome Completo"
                placeholder="Nome do titular"
                value={holder}
                onChange={onHolderChange}
              />
              <Field
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChange={onEmailChange}
                type="email"
              />
              <Field
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={maskPhoneBR(phone)}
                onChange={(t) => onPhoneChange(onlyDigits(t))}
                maxLength={16}
              />
            </div>
          </SectionCard>

          {/* Billing address */}
          {!isFree && (
            <SectionCard title="Endereço de Cobrança" icon={<MapPin className="h-4 w-4" />}>
              <div className="mb-3 grid grid-cols-3 gap-3">
                <Field
                  label="CEP"
                  placeholder="00000-000"
                  value={maskCep(cep)}
                  onChange={(t) => onCepChange(onlyDigits(t))}
                  maxLength={9}
                  className="col-span-2"
                />
                <Field
                  label="Número"
                  placeholder="123"
                  value={house}
                  onChange={onHouseChange}
                />
              </div>
              <Field
                label="Endereço"
                placeholder="Rua, bairro, cidade"
                value={address}
                onChange={onAddressChange}
              />
            </SectionCard>
          )}

          {/* Card data */}
          {paymentMethod === "card" && !isFree && (
            <SectionCard title="Dados do Cartão" icon={<CreditCard className="h-4 w-4" />}>
              <div className="flex flex-col gap-3">
                <Field
                  label="Número do Cartão"
                  placeholder="0000 0000 0000 0000"
                  value={maskCardNumber(cardNumber)}
                  onChange={onCardNumberChange}
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Validade"
                    placeholder="MM/AA"
                    value={maskExpiry(exp)}
                    onChange={onExpChange}
                    maxLength={5}
                  />
                  <Field
                    label="CVV"
                    placeholder="123"
                    value={onlyDigits(cvv).slice(0, 4)}
                    onChange={onCvvChange}
                    type="tel"
                    maxLength={4}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Coupon */}
          <SectionCard title="Cupom de Desconto" icon={<Ticket className="h-4 w-4" />}>
            <Field
              placeholder="CÓDIGO DO CUPOM"
              value={coupon}
              onChange={(t) => !discountPercent && onCouponChange(t.toUpperCase())}
              disabled={!!discountPercent}
              rightElement={
                <button
                  type="button"
                  onClick={onCheckCoupon}
                  disabled={isValidatingCoupon || !!discountPercent || !coupon.trim()}
                  className={cn(
                    "ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase transition-all",
                    discountPercent
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    (isValidatingCoupon || !!discountPercent || !coupon.trim()) &&
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
  );
}
