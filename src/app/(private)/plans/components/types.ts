export interface Plan {
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
  /**
   * Preço do Hub por meio e periodicidade, na chave `MEIO:PERIODICIDADE`.
   *
   * O Hub identifica a oferta escolhida pelo `priceId` — é ele que carrega
   * valor, meio e ciclo. Mandar plano e ciclo soltos, como o caminho antigo
   * fazia, deixaria o cliente dizer o que está comprando.
   */
  priceIds?: Record<string, string>;
}

export type BillingCycle = "MONTHLY" | "YEARLY";
export type PaymentMethod = "card" | "pix";
export type ViewState = "plans" | "checkout" | "success";
