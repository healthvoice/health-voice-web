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
/**
 * `pixAutomatic` e o padrao: e ele que cobra sozinho todo mes, sem cartao.
 *
 * `pix` comum nao e oferecido de saida — so aparece quando o banco do pagador
 * RECUSA a autorizacao do debito automatico, que e quando ele deixa de ser uma
 * escolha e passa a ser a saida.
 */
export type PaymentMethod = "card" | "pix" | "pixAutomatic";
export type ViewState = "plans" | "checkout" | "success";
