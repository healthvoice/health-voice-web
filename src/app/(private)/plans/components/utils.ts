export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );

export const EASE = [0.32, 0.72, 0, 1] as const;

import type { Plan, BillingCycle } from "./types";

export function getPlanPixPrice(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "YEARLY")
    return plan.pixYearlyPrice ?? (plan.pixPrice ?? 0) * 12;
  return plan.pixMonthlyPrice ?? plan.pixPrice ?? 0;
}

export function getPlanCreditPrice(plan: Plan, cycle: BillingCycle): number {
  if (cycle === "YEARLY")
    return plan.creditYearlyPrice ?? (plan.creditMonthlyPrice ?? 0) * 12;
  return plan.creditMonthlyPrice ?? plan.creditPrice ?? 0;
}

export function getRecordLabel(plan: Plan): string {
  if (plan.monthlyRecordAvailable != null)
    return `${plan.monthlyRecordAvailable} horas/mês`;
  if (plan.dailyRecordAvailable != null) {
    const hoursPerMonth = Math.round((plan.dailyRecordAvailable * 30) / 3600);
    return `${hoursPerMonth} horas/mês`;
  }
  return "Gravação incluída";
}

export function maskCpfCnpj(value: string): string {
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

export function maskCep(value: string): string {
  const v = onlyDigits(value).slice(0, 8);
  return v.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function maskPhoneBR(v: string): string {
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

export function maskCardNumber(v: string): string {
  return onlyDigits(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export function maskExpiry(v: string): string {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function parseExpiry(value: string): { month: string; year: string } | null {
  const m = value.match(/^(\d{2})[\/\-]?(\d{2}|\d{4})$/);
  if (!m) return null;
  const month = m[1];
  let year = m[2];
  if (Number(month) < 1 || Number(month) > 12) return null;
  if (year.length === 2) year = `20${year}`;
  return { month, year };
}
